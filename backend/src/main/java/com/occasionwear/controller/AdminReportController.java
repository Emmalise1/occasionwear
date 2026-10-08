package com.occasionwear.controller;

import com.occasionwear.dto.ReportSummaryResponse;
import com.occasionwear.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Admin dashboard KPIs and reports — ADMIN role required. */
@RestController
@RequestMapping("/api/admin/reports")
@Tag(name = "Admin — reports", description = "Dashboard statistics and reports (ADMIN only)")
public class AdminReportController {

    private final ReportService reportService;

    public AdminReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/summary")
    @Operation(summary = "Report summary",
        description = "Total bookings, bookings by status, outfits by status, total revenue, "
            + "active rentals, damaged outfits and revenue over time.")
    public ResponseEntity<ReportSummaryResponse> summary() {
        return ResponseEntity.ok(reportService.summary());
    }
}
