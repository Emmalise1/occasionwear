package com.occasionwear.controller;

import com.occasionwear.dto.OutfitResponse;
import com.occasionwear.entity.enums.OutfitCategory;
import com.occasionwear.service.OutfitService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Public outfit browsing with category/size/price/date availability filters. */
@RestController
@RequestMapping("/api/outfits")
@Tag(name = "Outfits", description = "Public catalogue browsing")
public class OutfitController {

    private final OutfitService outfitService;

    public OutfitController(OutfitService outfitService) {
        this.outfitService = outfitService;
    }

    @GetMapping
    @Operation(
        summary = "Browse outfits",
        description = "Filter by category, size, price range and date range. "
            + "When startDate and endDate are provided, only outfits available for the "
            + "complete period (no overlapping bookings) are returned.")
    public ResponseEntity<List<OutfitResponse>> list(
        @RequestParam(required = false) OutfitCategory category,
        @RequestParam(required = false) String size,
        @RequestParam(required = false) BigDecimal minPrice,
        @RequestParam(required = false) BigDecimal maxPrice,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        return ResponseEntity.ok(outfitService.list(category, size, minPrice, maxPrice, startDate, endDate));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Outfit details")
    public ResponseEntity<OutfitResponse> get(
        @Parameter(description = "Outfit id") @PathVariable Long id) {
        return ResponseEntity.ok(outfitService.get(id));
    }
}
