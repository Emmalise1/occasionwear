package com.occasionwear.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

/**
 * Boots the whole application (schema + demo seed) against in-memory H2 and
 * exercises the REST API exactly as the React frontend does:
 *
 * <ul>
 *   <li>every outfit exposes a fixed {@code rentalPrice} and a
 *       {@code rentalPeriodDays} of 5 for wedding wear / 3 for everything else
 *       (no {@code pricePerDay}, no {@code rentalMode});</li>
 *   <li>a booking derives the expected return date from the period and charges
 *       rental price + deposit — never price × days;</li>
 *   <li>a mismatching endDate is rejected with 400;</li>
 *   <li>admin outfit creation defaults the period by category.</li>
 * </ul>
 */
@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:h2:mem:occasionwear-test;DB_CLOSE_DELAY=-1",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect"
})
@AutoConfigureMockMvc
class RentalPricingApiTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper mapper;

    // ------------------------------------------------------------------ helpers

    private String login(String email, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("email", email, "password", password))))
            .andExpect(status().isOk())
            .andReturn();
        return mapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
    }

    private JsonNode catalogue(String token) throws Exception {
        MvcResult result = mockMvc.perform(get("/api/outfits")
                .header("Authorization", "Bearer " + token))
            .andExpect(status().isOk())
            .andReturn();
        return mapper.readTree(result.getResponse().getContentAsString());
    }

    private JsonNode firstOfCategory(JsonNode outfits, String category) {
        for (JsonNode outfit : outfits) {
            if (category.equals(outfit.get("category").asText())) {
                return outfit;
            }
        }
        throw new AssertionError("No seeded outfit in category " + category);
    }

    private JsonNode createBooking(String token, long outfitId, LocalDate start, LocalDate endDate)
        throws Exception {
        Map<String, Object> payload = new HashMap<>();
        payload.put("outfitId", outfitId);
        payload.put("startDate", start.toString());
        if (endDate != null) {
            payload.put("endDate", endDate.toString());
        }
        MvcResult result = mockMvc.perform(post("/api/bookings")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(payload)))
            .andExpect(status().isCreated())
            .andReturn();
        return mapper.readTree(result.getResponse().getContentAsString());
    }

    // -------------------------------------------------------------------- tests

    @Test
    void everyOutfitHasAFixedPriceAndTheCorrectRentalPeriod() throws Exception {
        JsonNode outfits = catalogue(login("customer@demo.com", "Demo1234"));
        assertTrue(outfits.isArray() && outfits.size() > 0, "seeded catalogue is served");

        for (JsonNode outfit : outfits) {
            String category = outfit.get("category").asText();
            String name = outfit.get("name").asText();

            // The daily-rate concept is gone from the API contract.
            assertNull(outfit.get("pricePerDay"), "pricePerDay must not be exposed");
            assertNull(outfit.get("rentalMode"), "rentalMode must not be exposed");
            assertTrue(outfit.get("rentalPrice").decimalValue().signum() > 0,
                category + " has a positive fixed rental price");

            boolean wedding = category.equals("BRIDAL_WEDDING_GOWNS")
                || category.equals("CIVIL_WEDDING_ATTIRE")
                || category.equals("WEDDING_GUEST");
            assertEquals(wedding ? 5 : 3, outfit.get("rentalPeriodDays").asInt(),
                category + " rental period");

            // Spec §11 price ranges for the seeded wedding categories
            // (outfits created by other tests use arbitrary prices).
            boolean seeded = !name.startsWith("API Test") && !name.startsWith("Custom Period");
            double price = outfit.get("rentalPrice").asDouble();
            if (seeded) {
                switch (category) {
                    case "BRIDAL_WEDDING_GOWNS" -> assertTrue(price >= 700_000,
                        "bridal gowns start around 700,000 RWF, was " + price);
                    case "CIVIL_WEDDING_ATTIRE" -> assertTrue(price >= 200_000 && price <= 450_000,
                        "civil wedding attire sits in 200,000–450,000 RWF, was " + price);
                    case "BRIDAL_SHOWER" -> assertTrue(price >= 120_000 && price <= 250_000,
                        "bridal shower sits in 120,000–250,000 RWF, was " + price);
                    default -> { /* no mandated range */ }
                }
            }
        }
    }

    @Test
    void bridalShowerIsNotGivenTheFiveDayWeddingPeriod() throws Exception {
        JsonNode outfits = catalogue(login("customer@demo.com", "Demo1234"));
        assertEquals(3, firstOfCategory(outfits, "BRIDAL_SHOWER").get("rentalPeriodDays").asInt());
        assertEquals(5, firstOfCategory(outfits, "BRIDAL_WEDDING_GOWNS").get("rentalPeriodDays").asInt());
        assertEquals(5, firstOfCategory(outfits, "WEDDING_GUEST").get("rentalPeriodDays").asInt());
        assertEquals(3, firstOfCategory(outfits, "GRADUATION").get("rentalPeriodDays").asInt());
    }

    @Test
    void bookingDerivesTheReturnDateAndChargesTheFixedPriceOnce() throws Exception {
        String customer = login("customer@demo.com", "Demo1234");
        JsonNode gown = firstOfCategory(catalogue(customer), "BRIDAL_WEDDING_GOWNS");
        double rentalPrice = gown.get("rentalPrice").asDouble();
        double deposit = gown.get("depositAmount").asDouble();

        LocalDate start = LocalDate.now().plusDays(30);
        JsonNode booking = createBooking(customer, gown.get("id").asLong(), start, null);

        // Wedding outfit → 5-day period, expected return = start + 5.
        assertEquals(start.plusDays(5).toString(), booking.get("endDate").asText());
        assertEquals(5, booking.get("outfit").get("rentalPeriodDays").asInt());
        // totalAmountDue at checkout = fixed rental price + refundable deposit — not × 5.
        assertEquals(rentalPrice + deposit, booking.get("totalAmount").asDouble(), 0.01);
        assertEquals(rentalPrice, booking.get("payment").get("amount").asDouble(), 0.01);
        assertEquals(deposit, booking.get("payment").get("deposit").asDouble(), 0.01);

        // Paying confirms the booking (mock checkout).
        MvcResult paid = mockMvc.perform(post("/api/bookings/" + booking.get("id").asLong() + "/pay")
                .header("Authorization", "Bearer " + customer)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"method\":\"CARD\",\"simulateFailure\":false}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("CONFIRMED"))
            .andExpect(jsonPath("$.payment.status").value("PAID"))
            .andReturn();
        JsonNode paidBooking = mapper.readTree(paid.getResponse().getContentAsString());
        assertEquals(rentalPrice + deposit,
            paidBooking.get("payment").get("amountDue").asDouble(), 0.01);
    }

    @Test
    void anEndDateOutsideTheFixedPeriodIsRejected() throws Exception {
        String customer = login("customer@demo.com", "Demo1234");
        JsonNode suit = firstOfCategory(catalogue(customer), "GRADUATION");
        LocalDate start = LocalDate.now().plusDays(45);

        // Graduation → fixed 3-day period; asking for 9 days must fail with 400.
        mockMvc.perform(post("/api/bookings")
                .header("Authorization", "Bearer " + customer)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"outfitId\":" + suit.get("id").asLong()
                    + ",\"startDate\":\"" + start + "\",\"endDate\":\"" + start.plusDays(9) + "\"}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value(
                org.hamcrest.Matchers.containsString("fixed at 3 day(s)")));
    }

    @Test
    void adminOutfitCreationDefaultsTheRentalPeriodByCategory() throws Exception {
        String admin = login("admin@demo.com", "Demo1234");

        assertEquals(3, createOutfit(admin, "GRADUATION").get("rentalPeriodDays").asInt());
        assertEquals(5, createOutfit(admin, "WEDDING_GUEST").get("rentalPeriodDays").asInt());
        assertEquals(5, createOutfit(admin, "BRIDAL_WEDDING_GOWNS").get("rentalPeriodDays").asInt());
        assertEquals(5, createOutfit(admin, "CIVIL_WEDDING_ATTIRE").get("rentalPeriodDays").asInt());
        assertEquals(3, createOutfit(admin, "BRIDAL_SHOWER").get("rentalPeriodDays").asInt());
        assertEquals(3, createOutfit(admin, "TRADITIONAL_CEREMONY").get("rentalPeriodDays").asInt());
        assertEquals(3, createOutfit(admin, "PHOTOSHOOT").get("rentalPeriodDays").asInt());
        assertEquals(3, createOutfit(admin, "ACCESSORY").get("rentalPeriodDays").asInt());
    }

    @Test
    void adminCanAdjustThePeriodButPricesMustBePositive() throws Exception {
        String admin = login("admin@demo.com", "Demo1234");

        // Explicit adjustment is honoured.
        Map<String, Object> payload = baseOutfit("Custom Period Gown", "BRIDAL_WEDDING_GOWNS");
        payload.put("rentalPeriodDays", 7);
        MvcResult created = mockMvc.perform(post("/api/admin/outfits")
                .header("Authorization", "Bearer " + admin)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(payload)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.rentalPeriodDays").value(7))
            .andReturn();
        assertEquals(7, mapper.readTree(created.getResponse().getContentAsString())
            .get("rentalPeriodDays").asInt());

        // A non-positive rental price is rejected.
        Map<String, Object> invalid = baseOutfit("Free Outfit", "GRADUATION");
        invalid.put("rentalPrice", 0);
        mockMvc.perform(post("/api/admin/outfits")
                .header("Authorization", "Bearer " + admin)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(invalid)))
            .andExpect(status().isBadRequest());
    }

    // ------------------------------------------------------------- payload bits

    private Map<String, Object> baseOutfit(String name, String category) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("name", name);
        payload.put("category", category);
        payload.put("size", "M");
        payload.put("color", "Ivory");
        payload.put("rentalPrice", 180000);
        payload.put("depositAmount", 70000);
        payload.put("imageUrl", "/images/grad-white-pantsuit.jpg");
        return payload;
    }

    private JsonNode createOutfit(String adminToken, String category) throws Exception {
        Map<String, Object> payload = baseOutfit("API Test " + category + " " + System.nanoTime(), category);
        MvcResult result = mockMvc.perform(post("/api/admin/outfits")
                .header("Authorization", "Bearer " + adminToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(payload)))
            .andExpect(status().isCreated())
            .andReturn();
        JsonNode created = mapper.readTree(result.getResponse().getContentAsString());
        assertEquals(category, created.get("category").asText());
        return created;
    }
}
