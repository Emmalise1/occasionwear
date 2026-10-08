package com.occasionwear.config;

import com.occasionwear.entity.Admin;
import com.occasionwear.entity.Booking;
import com.occasionwear.entity.Customer;
import com.occasionwear.entity.Outfit;
import com.occasionwear.entity.Payment;
import com.occasionwear.entity.enums.BookingStatus;
import com.occasionwear.entity.enums.OutfitCategory;
import com.occasionwear.entity.enums.OutfitStatus;
import com.occasionwear.entity.enums.PaymentMethod;
import com.occasionwear.entity.enums.PaymentStatus;
import com.occasionwear.entity.enums.Role;
import com.occasionwear.repository.AdminRepository;
import com.occasionwear.repository.BookingRepository;
import com.occasionwear.repository.CustomerRepository;
import com.occasionwear.repository.OutfitRepository;
import com.occasionwear.repository.PersonRepository;
import com.occasionwear.service.RentalPeriods;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Seeds demo accounts, the outfit catalogue (with real product images from
 * frontend/public/images) and demo bookings the first time the application
 * starts against an empty database.
 *
 * <p>Every seeded price is a FIXED rental price in RWF for the outfit's whole
 * rental period (wedding wear → 5 days, all other outfits → 3 days) — never a
 * daily rate — plus a one-off refundable security deposit. This is a rental
 * business, not a shop.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);
    public static final String DEMO_PASSWORD = "Demo1234";

    private final PersonRepository personRepository;
    private final CustomerRepository customerRepository;
    private final AdminRepository adminRepository;
    private final OutfitRepository outfitRepository;
    private final BookingRepository bookingRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(PersonRepository personRepository,
                      CustomerRepository customerRepository,
                      AdminRepository adminRepository,
                      OutfitRepository outfitRepository,
                      BookingRepository bookingRepository,
                      PasswordEncoder passwordEncoder) {
        this.personRepository = personRepository;
        this.customerRepository = customerRepository;
        this.adminRepository = adminRepository;
        this.outfitRepository = outfitRepository;
        this.bookingRepository = bookingRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        seedPeople();
        seedOutfits();
        seedBookings();
    }

    private void seedPeople() {
        if (personRepository.count() > 0) {
            return;
        }

        Customer customer = new Customer();
        customer.setName("Aline Uwase");
        customer.setEmail("customer@demo.com");
        customer.setPhone("+250 788 123 456");
        customer.setAddress("KN 4 Avenue, Kigali, Rwanda");
        customer.setPassword(passwordEncoder.encode(DEMO_PASSWORD));
        customer.setRole(Role.CUSTOMER);
        customerRepository.save(customer);

        Admin admin = new Admin();
        admin.setName("Eric Mugisha");
        admin.setEmail("admin@demo.com");
        admin.setPhone("+250 788 654 321");
        admin.setStaffRole("Manager");
        admin.setPassword(passwordEncoder.encode(DEMO_PASSWORD));
        admin.setRole(Role.ADMIN);
        adminRepository.save(admin);

        log.info("Seeded demo accounts: customer@demo.com / {} and admin@demo.com / {}", DEMO_PASSWORD, DEMO_PASSWORD);
    }

    private void seedOutfits() {
        if (outfitRepository.count() > 0) {
            return;
        }
        Admin manager = adminRepository.findFirstByOrderByIdAsc().orElse(null);

        // rentalPrice = fixed total price for the rental period (RWF);
        // deposit = one-off refundable security deposit.
        List<Outfit> outfits = List.of(
            // ---------------------------------------------------- wedding guest
            outfit("Kigali Emerald Evening Gown", OutfitCategory.WEDDING_GUEST, "M", "Emerald Green",
                "150000", "60000", "/images/gown-emerald-green-formal.jpg",
                "A floor-length emerald gown with a sculpted silhouette — the centrepiece for cocktail hours and wedding receptions in Kigali."),
            outfit("Akagera Gold Celebration Dress", OutfitCategory.WEDDING_GUEST, "S", "Champagne Gold",
                "120000", "45000", "/images/dress-akagera-gold-evening.jpg",
                "Sequin-detailed champagne gold dress that catches the light at every toast."),
            outfit("Imanzi Wedding Guest Dress", OutfitCategory.WEDDING_GUEST, "S", "Monochrome Floral",
                "90000", "32000", "/images/culture-brown-satin-guest-dress.jpg",
                "An elegant satin midi with a soft drape — an easy yes for garden weddings and receptions."),
            outfit("Muhazi Satin Wrap Dress", OutfitCategory.WEDDING_GUEST, "M", "Burgundy",
                "85000", "30000", "/images/dress-burgundy-satin-wrap.jpg",
                "A burgundy satin wrap dress that moves beautifully from afternoon ceremony to evening party."),
            outfit("Kigali Classic Black Tuxedo", OutfitCategory.WEDDING_GUEST, "L", "Classic Black",
                "175000", "70000", "/images/suit-black-classic-tuxedo.jpg",
                "The timeless black tuxedo with satin lapels — black-tie events, gala nights and groomsmen duties."),
            outfit("Yellow Birthday Cocktail Dress", OutfitCategory.WEDDING_GUEST, "S", "Sunflower Yellow",
                "80000", "28000", "/images/dress-yellow-birthday-cocktail.jpg",
                "A bright sunflower-yellow cocktail dress made for birthdays, brunches and celebratory photos."),
            outfit("Purple Velvet Party Dress", OutfitCategory.WEDDING_GUEST, "M", "Royal Purple",
                "95000", "34000", "/images/dress-purple-velvet-party.jpg",
                "Rich royal-purple velvet with a flattering fit — party season without the purchase price."),
            outfit("Prom Emerald Satin Gown", OutfitCategory.WEDDING_GUEST, "M", "Emerald Satin",
                "110000", "40000", "/images/prom-emerald-satin-gown.jpg",
                "Liquid emerald satin with a subtle sheen — prom nights and formal dances."),
            outfit("Prom Olive Green Halter Dress", OutfitCategory.WEDDING_GUEST, "S", "Olive Green",
                "90000", "32000", "/images/prom-olive-green-halter.jpg",
                "A modern olive halter silhouette that keeps guests cool and camera-ready."),
            outfit("Prom Black Mermaid Gown", OutfitCategory.WEDDING_GUEST, "M", "Jet Black",
                "120000", "44000", "/images/prom-black-mermaid-gown.jpg",
                "A jet-black mermaid gown with dramatic flair for the biggest nights of the year."),
            outfit("Prom Champagne Beaded Dress", OutfitCategory.WEDDING_GUEST, "S", "Champagne",
                "130000", "48000", "/images/prom-champagne-beaded-dress.jpg",
                "Hand-beaded champagne tones that photograph like a dream under event lighting."),
            outfit("Prom Red Velvet Slit Gown", OutfitCategory.WEDDING_GUEST, "M", "Ruby Red",
                "125000", "45000", "/images/prom-red-velvet-slit-gown.jpg",
                "Ruby-red velvet with a confident thigh slit — for entrances that matter."),
            outfit("Brown Lace Cocktail Dress", OutfitCategory.WEDDING_GUEST, "S", "Cocoa Brown",
                "75000", "26000", "/images/guest-brown-lace-cocktail.jpg",
                "Delicate cocoa lace cut to a flattering cocktail length — an effortless wedding-guest look."),
            outfit("One-Shoulder Black Guest Dress", OutfitCategory.WEDDING_GUEST, "M", "Jet Black",
                "80000", "28000", "/images/guest-black-one-shoulder.jpg",
                "A sculpted one-shoulder black dress that reads formal without trying too hard."),
            outfit("Pink Slip Guest Dress", OutfitCategory.WEDDING_GUEST, "S", "Blush Pink",
                "75000", "26000", "/images/guest-pink-slip-dress.jpg",
                "A blush satin slip dress — light, elegant and made for daytime ceremonies."),
            outfit("Red Formal Guest Gown", OutfitCategory.WEDDING_GUEST, "M", "Deep Red",
                "100000", "36000", "/images/guest-red-formal-gown.jpg",
                "A deep-red formal gown for evening receptions and engagement parties."),
            outfit("Black Evening Guest Dress", OutfitCategory.WEDDING_GUEST, "L", "Black",
                "85000", "30000", "/images/guest-black-evening-dress.jpg",
                "A classic black evening dress — the dependable choice for any formal invitation."),

            // ------------------------------------------ traditional / cultural
            outfit("Imena Traditional Ceremony Set", OutfitCategory.TRADITIONAL_CEREMONY, "M", "Terracotta & Cream",
                "84000", "55000", "/images/culture-imena-traditional-attire.jpg",
                "A hand-finished traditional set inspired by Rwandan ceremony dress — perfect for umushanane and family celebrations."),
            outfit("Intore Heritage Ensemble", OutfitCategory.TRADITIONAL_CEREMONY, "XL", "Red & Earth Tones",
                "96000", "60000", "/images/culture-intore-heritage-attire.jpg",
                "A heritage ensemble with beadwork and bold earth tones, honouring Rwandan tradition with a modern cut."),
            outfit("Cultural Wedding Ceremony Set", OutfitCategory.TRADITIONAL_CEREMONY, "M", "Traditional Multicolour",
                "78000", "50000", "/images/culture-traditional-ceremony-group.jpg",
                "A coordinated ceremony set for cultural weddings — styled for the whole bridal party."),
            outfit("Rwandan Blue Traditional Outfit", OutfitCategory.TRADITIONAL_CEREMONY, "M", "Indigo Blue",
                "72000", "45000", "/images/culture-rwandan-blue-traditional.jpg",
                "Indigo traditional tailoring with clean lines — dignified and comfortably festive."),
            outfit("Gihanga Wedding Party Attire", OutfitCategory.TRADITIONAL_CEREMONY, "M", "Ceremony White & Gold",
                "66000", "40000", "/images/culture-wedding-party-group.jpg",
                "Coordinated wedding-party attire worn by the whole entourage for traditional wedding rites."),
            outfit("Traditional Brown Gown", OutfitCategory.TRADITIONAL_CEREMONY, "M", "Warm Brown",
                "75000", "46000", "/images/culture-traditional-brown-gown.jpg",
                "A warm-brown traditional gown with structured shoulders for honoured family occasions."),
            outfit("Green Traditional Fabric Set", OutfitCategory.TRADITIONAL_CEREMONY, "M", "Forest Green",
                "69000", "42000", "/images/culture-traditional-green-fabric.jpg",
                "Forest-green traditional fabric draped and tailored for ceremony days."),
            outfit("Gold Traditional Ensemble", OutfitCategory.TRADITIONAL_CEREMONY, "L", "Gold & Black",
                "90000", "56000", "/images/culture-traditional-gold-ensemble.jpg",
                "A gold-accented ensemble for milestone ceremonies — elaborate beadwork included."),
            outfit("Traditional Family Group Set", OutfitCategory.TRADITIONAL_CEREMONY, "XL", "Earth Tones",
                "81000", "50000", "/images/culture-traditional-family-group.jpg",
                "Matching family-set pieces for reunions, thanksgivings and traditional introductions."),
            outfit("Outdoor Traditional Portrait Gown", OutfitCategory.TRADITIONAL_CEREMONY, "M", "Natural Linen",
                "72000", "44000", "/images/culture-traditional-outdoor-portrait.jpg",
                "Natural-toned traditional gown styled for outdoor portraits and daytime ceremonies."),
            outfit("Huye Classic Traditional Outfit", OutfitCategory.TRADITIONAL_CEREMONY, "L", "Classic Neutrals",
                "66000", "40000", "/images/traditional-outfit.jpg",
                "A classic traditional outfit in neutral tones — understated, timeless and dignified."),

            // ------------------------------------------------------- graduation
            outfit("Umucyo Graduation Suit", OutfitCategory.GRADUATION, "L", "Charcoal Grey",
                "66000", "40000", "/images/grad-umucyo-tailored-suit.jpg",
                "A sharp two-piece suit that photographs beautifully under gown and cap — graduation day, sorted."),
            outfit("Graduation Blue Blazer Set", OutfitCategory.GRADUATION, "M", "Navy Blue",
                "63000", "38000", "/images/grad-blue-blazer-set.jpg",
                "A navy blazer set with a clean profile — smart under the gown and sharp for the celebration after."),
            outfit("Graduation White Pantsuit", OutfitCategory.GRADUATION, "S", "Ivory White",
                "69000", "42000", "/images/grad-white-pantsuit.jpg",
                "An ivory pantsuit for graduates who want a modern, powerful silhouette."),
            outfit("Graduation Pink Blazer Suit", OutfitCategory.GRADUATION, "M", "Soft Pink",
                "60000", "36000", "/images/grad-pink-blazer-suit.jpg",
                "A soft-pink blazer suit that stands out in the graduation photos."),
            outfit("White Double-Breasted Suit", OutfitCategory.GRADUATION, "L", "Optic White",
                "75000", "45000", "/images/grad-white-double-breasted-suit.jpg",
                "An optic-white double-breasted suit — confident, celebratory and tailored."),
            outfit("Off-White Tailored Suit", OutfitCategory.GRADUATION, "M", "Off-White",
                "72000", "43000", "/images/grad-offwhite-tailored-suit.jpg",
                "An off-white tailored suit for graduates who prefer quiet elegance over bold statements."),

            // ------------------------------------------------------- photoshoot
            outfit("Serenity Lavender Tulle Gown", OutfitCategory.PHOTOSHOOT, "M", "Lavender",
                "66000", "40000", "/images/gown-lavender-tulle-editorial.jpg",
                "Layers of lavender tulle built for editorial movement — stunning in studio light."),
            outfit("Nyungwe Velvet Cape Gown", OutfitCategory.PHOTOSHOOT, "L", "Maroon",
                "78000", "50000", "/images/gown-maroon-velvet-cape.jpg",
                "Maroon velvet with a dramatic cape — a showstopper for editorial shoots and premieres."),
            outfit("Red Silk Sari Editorial", OutfitCategory.PHOTOSHOOT, "M", "Crimson Red",
                "72000", "44000", "/images/photoshoot-red-silk-sari.jpg",
                "Fluid crimson silk with a classic drape — made for rich, warm-toned photo sets."),
            outfit("White Gown with Train", OutfitCategory.PHOTOSHOOT, "M", "Bridal White",
                "90000", "58000", "/images/photoshoot-white-gown-train.jpg",
                "A sweeping white gown with a long train — bridal editorials and dramatic staircases."),
            outfit("Yellow Sunburst Dress", OutfitCategory.PHOTOSHOOT, "S", "Bright Yellow",
                "63000", "38000", "/images/photoshoot-yellow-sunburst-dress.jpg",
                "A bright yellow statement piece that glows against outdoor and studio backdrops."),
            outfit("Pink Tiered Gown", OutfitCategory.PHOTOSHOOT, "M", "Powder Pink",
                "78000", "48000", "/images/photoshoot-pink-tiered-gown.jpg",
                "Cascading powder-pink tiers that create movement in every frame."),
            outfit("Purple Velvet Pose Gown", OutfitCategory.PHOTOSHOOT, "M", "Deep Purple",
                "75000", "46000", "/images/photoshoot-purple-velvet-pose.jpg",
                "Deep-purple velvet that holds its shape — designed for striking posed portraits."),
            outfit("Blue Satin Photoshoot Dress", OutfitCategory.PHOTOSHOOT, "S", "Royal Blue",
                "66000", "40000", "/images/photoshoot-blue-satin-dress.jpg",
                "Royal-blue satin with a liquid finish — clean, bold and endlessly photogenic."),

            // -------------------------------------------------------- accessories
            outfit("Golden Hills Statement Clutch", OutfitCategory.ACCESSORY, "ONE SIZE", "Gold",
                "24000", "18000", "/images/accessory-gold-metallic-clutch.jpg",
                "A gold metallic clutch that lifts any evening look — room for a phone, lipstick and cards."),
            outfit("Kigali Pearl Evening Heels", OutfitCategory.ACCESSORY, "EU 38", "Pearl White",
                "18000", "14000", "/images/shoe-white-pearl-strappy-heel.jpg",
                "Pearl-white strappy heels with a comfortable block heel — for long reception evenings."),
            outfit("Silver Choker Necklace", OutfitCategory.ACCESSORY, "ONE SIZE", "Silver",
                "10500", "8000", "/images/accessory-silver-choker-necklace.jpg",
                "A sleek silver choker — the simple finishing touch for a modern neckline."),
            outfit("Gold Pendant Necklace", OutfitCategory.ACCESSORY, "ONE SIZE", "Gold",
                "12000", "9000", "/images/accessory-gold-pendant-necklace.jpg",
                "A delicate gold pendant that pairs with both traditional and contemporary looks."),
            outfit("Gold Statement Necklace", OutfitCategory.ACCESSORY, "ONE SIZE", "Gold",
                "22500", "16000", "/images/accessory-gold-statement-necklace.jpg",
                "A bold gold statement necklace that carries an outfit on its own."),
            outfit("Pearl Layered Necklace", OutfitCategory.ACCESSORY, "ONE SIZE", "Pearl",
                "15000", "11000", "/images/accessory-pearl-layered-necklace.jpg",
                "Layered pearls with a contemporary finish — elegant, never ageing."),
            outfit("Gold Cuff Bracelet", OutfitCategory.ACCESSORY, "ONE SIZE", "Gold",
                "16500", "12000", "/images/accessory-gold-cuff-bracelet.jpg",
                "A sculptural gold cuff — instant polish for bare wrists at evening events."),

            // ------------------------------------- bridal wedding gowns (5-day rental period)
            // Fixed rental prices from 700,000 RWF upward — charged once for the whole period.
            outfit("Champagne Corset Bridal Gown", OutfitCategory.BRIDAL_WEDDING_GOWNS, "M", "Champagne",
                "700000", "350000", "/images/bridal-champagne-corset-dress.jpg",
                "A corseted champagne gown with structured bodice and sweeping skirt — our standard premium bridal rental for the ceremony and portraits."),
            outfit("Ivory Mermaid Bridal Gown", OutfitCategory.BRIDAL_WEDDING_GOWNS, "M", "Ivory White",
                "1000000", "450000", "/images/bridal-ivory-mermaid-gown.jpg",
                "A designer-style ivory mermaid gown that hugs every curve before flaring into a dramatic train — for the bride who wants the aisle to remember."),
            outfit("Luxury Off-Shoulder Bridal Gown", OutfitCategory.BRIDAL_WEDDING_GOWNS, "S", "Bridal White",
                "1500000", "500000", "/images/bridal-offshoulder-slit-gown.jpg",
                "A luxury statement gown with off-shoulder neckline and fashion-forward slit — the highest tier in our bridal collection."),
            outfit("Luxury Bridal Ball Gown with Train", OutfitCategory.BRIDAL_WEDDING_GOWNS, "M", "Bridal White",
                "850000", "400000", "/images/wedding-bridal-ballgown-train.jpg",
                "A voluminous ball gown with a sweeping train — classic luxury for cathedral ceremonies and grand receptions."),

            // --------------------------------------- civil wedding attire (5-day rental period)
            outfit("Classic Civil Wedding White Suit", OutfitCategory.CIVIL_WEDDING_ATTIRE, "L", "Optic White",
                "350000", "150000", "/images/civil-white-suit-portrait.jpg",
                "A tailored white suit for civil ceremonies and court weddings — sharp, modern and photographs beautifully beside the register."),
            outfit("Elegant Civil Wedding Dress", OutfitCategory.CIVIL_WEDDING_ATTIRE, "M", "Ivory White",
                "275000", "120000", "/images/civil-white-cocktail-dress.jpg",
                "An elegant white dress for civil ceremonies and the reception that follows — refined, comfortable and effortlessly photographed."),

            // ------------------------------------------ bridal shower (3-day rental period)
            // Bridal Shower is NOT wedding wear for the rental-period rule → 3 days.
            outfit("Ivory Lace Bridal Shower Dress", OutfitCategory.BRIDAL_SHOWER, "S", "Ivory",
                "150000", "70000", "/images/bridal-white-lace-cocktail.jpg",
                "A delicate ivory lace cocktail dress — the refined choice for an intimate bridal shower with close friends and family."),
            outfit("White Feather Bridal Shower Dress", OutfitCategory.BRIDAL_SHOWER, "M", "White",
                "210000", "90000", "/images/bridal-white-feather-gown.jpg",
                "A playful white dress with feather detailing — premium shower attire that makes the bride-to-be the brightest person in the room.")
        );

        outfits.forEach(o -> o.setManager(manager));
        outfitRepository.saveAll(outfits);
        log.info("Seeded {} outfits with real product images.", outfits.size());
    }

    private void seedBookings() {
        if (bookingRepository.count() > 0) {
            return;
        }
        Customer customer = customerRepository.findByEmail("customer@demo.com").orElse(null);
        Admin admin = adminRepository.findFirstByOrderByIdAsc().orElse(null);
        if (customer == null) {
            return;
        }

        // Completed past rental (paid) → gives the reports page real revenue history
        Outfit gown = findOutfit("Kigali Emerald Evening Gown");
        if (gown != null) {
            Booking booking = new Booking();
            booking.setReference("OW-DEMO01");
            booking.setStartDate(LocalDate.of(2026, 9, 20));
            // Wedding Guest outfit → fixed 5-day rental period: 20 Sep → 25 Sep.
            booking.setEndDate(LocalDate.of(2026, 9, 25));
            booking.setReturnDate(LocalDate.of(2026, 9, 23));
            booking.setCustomer(customer);
            booking.setAdmin(admin);
            booking.setOutfit(gown);
            booking.setStatus(BookingStatus.COMPLETED);
            booking.setCreatedAt(LocalDateTime.of(2026, 9, 15, 10, 0));
            // One fixed rental price for the whole period — never price × days.
            BigDecimal rental = gown.getRentalPrice();
            booking.setTotalAmount(rental.add(gown.getDepositAmount()));

            Payment payment = new Payment();
            payment.setAmount(rental);
            payment.setDeposit(gown.getDepositAmount());
            payment.setMethod(PaymentMethod.MOBILE_MONEY);
            payment.setStatus(PaymentStatus.PAID);
            payment.setPaymentDate(LocalDateTime.of(2026, 9, 15, 10, 5));
            payment.setBooking(booking);
            booking.setPayment(payment);

            bookingRepository.save(booking);
        }

        // Upcoming confirmed rental → shows RESERVED behaviour and availability blocking
        Outfit tuxedo = findOutfit("Kigali Classic Black Tuxedo");
        if (tuxedo != null) {
            Booking booking = new Booking();
            booking.setReference("OW-DEMO02");
            booking.setStartDate(LocalDate.of(2026, 10, 15));
            // Wedding Guest outfit → fixed 5-day rental period: 15 Oct → 20 Oct.
            booking.setEndDate(LocalDate.of(2026, 10, 20));
            booking.setCustomer(customer);
            booking.setAdmin(admin);
            booking.setOutfit(tuxedo);
            booking.setStatus(BookingStatus.CONFIRMED);
            booking.setCreatedAt(LocalDateTime.of(2026, 10, 1, 9, 0));
            BigDecimal rental = tuxedo.getRentalPrice();
            booking.setTotalAmount(rental.add(tuxedo.getDepositAmount()));

            Payment payment = new Payment();
            payment.setAmount(rental);
            payment.setDeposit(tuxedo.getDepositAmount());
            payment.setMethod(PaymentMethod.CARD);
            payment.setStatus(PaymentStatus.PAID);
            payment.setPaymentDate(LocalDateTime.of(2026, 10, 1, 9, 5));
            payment.setBooking(booking);
            booking.setPayment(payment);

            bookingRepository.save(booking);

            tuxedo.updateStatus(OutfitStatus.RESERVED);
            outfitRepository.save(tuxedo);
        }

        log.info("Seeded demo bookings OW-DEMO01 (COMPLETED) and OW-DEMO02 (CONFIRMED).");
    }

    private Outfit findOutfit(String name) {
        return outfitRepository.findAll().stream()
            .filter(o -> o.getName().equals(name))
            .findFirst()
            .orElse(null);
    }

    /**
     * Builds a seeded outfit with a FIXED rental price for its whole rental
     * period. The period follows the category rule: wedding wear → 5 days,
     * everything else → 3 days (see {@link RentalPeriods}).
     */
    private Outfit outfit(String name, OutfitCategory category, String size, String color,
                          String rentalPrice, String deposit, String imageUrl, String description) {
        Outfit outfit = new Outfit();
        outfit.setName(name);
        outfit.setCategory(category);
        outfit.setSize(size);
        outfit.setColor(color);
        outfit.setRentalPrice(new BigDecimal(rentalPrice));
        outfit.setRentalPeriodDays(RentalPeriods.defaultDays(category));
        outfit.setDepositAmount(new BigDecimal(deposit));
        outfit.setLateFeePerDay(Outfit.DEFAULT_LATE_FEE_PER_DAY);
        outfit.setImageUrl(imageUrl);
        outfit.setDescription(description);
        outfit.setStatus(OutfitStatus.AVAILABLE);
        return outfit;
    }
}
