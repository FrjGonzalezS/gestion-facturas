using InvoiceManagement.Api.Application.Services;
using InvoiceManagement.Api.Application.DTOs;

namespace InvoiceManagement.Api.Endpoints;

public static class ReportEndpoints
{
    public static void MapReportEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/reports")
            .WithTags("Reports")
            .WithOpenApi();

        group.MapGet("/overdue-30d-without-payment-without-cn", GetOverdueInvoicesAsync)
            .WithName("GetOverdueInvoices")
            .WithDescription("Get invoices overdue >30 days without payment and without credit notes")
            .Produces<List<OverdueInvoiceDto>>(StatusCodes.Status200OK);

        group.MapGet("/payment-status-summary", GetPaymentStatusSummaryAsync)
            .WithName("GetPaymentStatusSummary")
            .WithDescription("Get summary and percentage breakdown by payment status")
            .Produces<PaymentStatusSummaryDto>(StatusCodes.Status200OK);

        group.MapGet("/inconsistents", GetInconsistentInvoicesAsync)
            .WithName("GetInconsistentInvoices")
            .WithDescription("Get all inconsistent invoices (total != sum of items)")
            .Produces<List<InconsistentInvoiceDto>>(StatusCodes.Status200OK);
    }

    private static async Task<IResult> GetOverdueInvoicesAsync(ReportService reportService)
    {
        var result = await reportService.GetOverdue30DaysWithoutPaymentWithoutCreditNotesAsync();
        return Results.Ok(result);
    }

    private static async Task<IResult> GetPaymentStatusSummaryAsync(ReportService reportService)
    {
        var result = await reportService.GetPaymentStatusSummaryAsync();
        return Results.Ok(result);
    }

    private static async Task<IResult> GetInconsistentInvoicesAsync(ReportService reportService)
    {
        var result = await reportService.GetInconsistentInvoicesAsync();
        return Results.Ok(result);
    }
}
