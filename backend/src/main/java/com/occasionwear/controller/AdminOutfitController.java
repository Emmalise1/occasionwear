package com.occasionwear.controller;

import com.occasionwear.dto.OutfitRequest;
import com.occasionwear.dto.OutfitResponse;
import com.occasionwear.entity.enums.OutfitCategory;
import com.occasionwear.entity.enums.OutfitStatus;
import com.occasionwear.service.OutfitService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Admin inventory management — every endpoint requires the ADMIN role. */
@RestController
@RequestMapping("/api/admin/outfits")
@Tag(name = "Admin — inventory", description = "Manage outfits (ADMIN only). DELETE retires, never deletes.")
public class AdminOutfitController {

    private final OutfitService outfitService;

    public AdminOutfitController(OutfitService outfitService) {
        this.outfitService = outfitService;
    }

    @GetMapping
    @Operation(summary = "List outfits", description = "Filter by status, category, size, name search and price range.")
    public ResponseEntity<List<OutfitResponse>> list(
        @RequestParam(required = false) OutfitStatus status,
        @RequestParam(required = false) OutfitCategory category,
        @RequestParam(required = false) String size,
        @RequestParam(required = false) String search,
        @RequestParam(required = false) BigDecimal minPrice,
        @RequestParam(required = false) BigDecimal maxPrice) {
        return ResponseEntity.ok(outfitService.adminList(status, category, size, search, minPrice, maxPrice));
    }

    @PostMapping
    @Operation(summary = "Create an outfit")
    public ResponseEntity<OutfitResponse> create(@Valid @RequestBody OutfitRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(outfitService.create(request));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an outfit", description = "Status transitions are validated (DAMAGED → AVAILABLE or RETIRED only).")
    public ResponseEntity<OutfitResponse> update(@PathVariable Long id, @Valid @RequestBody OutfitRequest request) {
        return ResponseEntity.ok(outfitService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Retire an outfit", description = "Never a physical delete — the outfit is marked RETIRED.")
    public ResponseEntity<OutfitResponse> retire(@PathVariable Long id) {
        return ResponseEntity.ok(outfitService.retire(id));
    }
}
