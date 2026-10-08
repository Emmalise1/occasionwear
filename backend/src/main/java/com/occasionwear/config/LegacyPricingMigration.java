package com.occasionwear.config;

import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * One-time data migration for databases created before the fixed-price model.
 *
 * <p>Older schemas stored {@code price_per_day} (a daily rate for classic
 * categories, a flat package price for {@code rental_mode = 'EVENT'} rows) and
 * had no rental period. This runner backfills the new columns on startup:
 *
 * <ul>
 *   <li>{@code rental_price} — the fixed price for the whole rental period
 *       (flat rows keep their price; daily rows are converted to
 *       daily rate × the category's rental period: wedding wear → 5 days,
 *       everything else → 3 days);</li>
 *   <li>{@code rental_period_days} — 5 for wedding categories, 3 for the rest;</li> * <li>{@code late_fee_per_day} — the standard 2,000 RWF.</li>
 * </ul>
 *
 * <p>It also relaxes leftover {@code outfits} columns that the fixed-price
 * model no longer writes (e.g. {@code price_per_day}, {@code rental_mode}).
 * Those were created as {@code NOT NULL} without a default, which makes
 * strict-mode MySQL reject every INSERT that omits them. They stay in the
 * table (data preserved) but become nullable so the new model can insert.
 *
 * <p>On a fresh database the legacy column does not exist and the runner does
 * nothing. Failures are logged and never prevent the application from starting.
 */
@Component
@Order(0) // runs before DataSeeder
public class LegacyPricingMigration implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(LegacyPricingMigration.class);

    private static final String WEDDING_CATEGORIES =
        "('BRIDAL_WEDDING_GOWNS', 'CIVIL_WEDDING_ATTIRE', 'WEDDING_GUEST')";

    private final JdbcTemplate jdbc;

    public LegacyPricingMigration(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void run(String... args) {
        try {
            if (!columnExists("outfits", "price_per_day")) {
                return; // fresh schema — nothing to migrate
            }

            boolean hasRentalMode = columnExists("outfits", "rental_mode");
            int priceRows = jdbc.update(
                "UPDATE outfits SET rental_price = CASE "
                    + "WHEN " + (hasRentalMode ? "rental_mode = 'EVENT'" : "1 = 0")
                    + " THEN price_per_day "
                    + "ELSE price_per_day * CASE WHEN category IN " + WEDDING_CATEGORIES
                    + " THEN 5 ELSE 3 END END "
                    + "WHERE rental_price IS NULL OR rental_price = 0");
            int periodRows = jdbc.update(
                "UPDATE outfits SET rental_period_days = CASE WHEN category IN " + WEDDING_CATEGORIES
                    + " THEN 5 ELSE 3 END WHERE rental_period_days IS NULL");
            int feeRows = jdbc.update(
                "UPDATE outfits SET late_fee_per_day = 2000 WHERE late_fee_per_day IS NULL");

            if (priceRows + periodRows + feeRows > 0) {
                log.info("Legacy pricing migration: {} rental price(s), {} rental period(s), "
                    + "{} late fee(s) backfilled for the fixed-price rental model.",
                    priceRows, periodRows, feeRows);
            }

            relaxUnmappedColumns();
        } catch (Exception ex) {
            log.warn("Legacy pricing migration skipped: {}", ex.getMessage());
        }
    }

    /** Columns of {@code outfits} written by the current entity (see the INSERT
     *  Hibernate generates). Anything else NOT NULL without a default is legacy. */
    private static final List<String> MAPPED_OUTFIT_COLUMNS = List.of(
        "ID", "CATEGORY", "COLOR", "DEPOSIT_AMOUNT", "DESCRIPTION", "IMAGE_URL",
        "LATE_FEE_PER_DAY", "MANAGER_ID", "NAME", "RENTAL_PERIOD_DAYS",
        "RENTAL_PRICE", "SIZE", "STATUS");

    /**
     * Makes legacy columns that the app no longer writes NULLABLE so strict-mode
     * MySQL accepts INSERTs which omit them. The column type is preserved
     * (read from information_schema) and no data is deleted.
     */
    private void relaxUnmappedColumns() {
        String notIn = MAPPED_OUTFIT_COLUMNS.stream()
            .map(name -> "'" + name + "'")
            .collect(java.util.stream.Collectors.joining(","));
        List<Map<String, Object>> legacyColumns = jdbc.queryForList(
            "SELECT COLUMN_NAME, COLUMN_TYPE FROM information_schema.columns "
                + "WHERE table_schema = DATABASE() AND table_name = 'outfits' "
                + "AND IS_NULLABLE = 'NO' AND COLUMN_DEFAULT IS NULL "
                + "AND EXTRA NOT LIKE '%auto_increment%' "
                + "AND UPPER(COLUMN_NAME) NOT IN (" + notIn + ")");

        for (Map<String, Object> column : legacyColumns) {
            String name = column.get("COLUMN_NAME").toString();
            String type = column.get("COLUMN_TYPE").toString();
            jdbc.execute("ALTER TABLE outfits MODIFY COLUMN `" + name + "` " + type + " NULL");
            log.info("Legacy schema fix: outfits.{} ({}) relaxed to NULLABLE "
                + "— no longer written by the fixed-price model.", name, type);
        }
    }

    private boolean columnExists(String table, String column) {
        Integer count = jdbc.queryForObject(
            "SELECT COUNT(*) FROM information_schema.columns "
                + "WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?",
            Integer.class, table, column);
        return count != null && count > 0;
    }
}
