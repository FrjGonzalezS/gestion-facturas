using Microsoft.EntityFrameworkCore;
using InvoiceManagement.Api.Domain;
using InvoiceManagement.Api.Infrastructure;
using InvoiceManagement.Api.Application.DTOs;

namespace InvoiceManagement.Api.Application.Services;

public class ReportService
{
    private readonly InvoiceDbContext _context;

    public ReportService(InvoiceDbContext context)
    {
        _context = context;
    }

    public async Task<List<OverdueInvoiceDto>> GetOverdue30DaysWithoutPaymentWithoutCreditNotesAsync()
    {
        var now = DateTime.UtcNow.Date;
        var thirtyDaysAgo = now.AddDays(-30);

        var invoices = await _context.Invoices
            .AsNoTracking()
            .Include(i => i.CreditNotes)
            .Include(i => i.Payment)
            .Where(i => i.IsConsistent 
                && i.PaymentDueDate < thirtyDaysAgo
                && i.Payment == null)
            .ToListAsync();

        var result = invoices
            .Where(i => !i.CreditNotes.Any())
            .Select(i => new OverdueInvoiceDto(
                i.Id,
                i.InvoiceNumber,
                i.CustomerName,
                i.InvoiceDate,
                i.PaymentDueDate,
                i.TotalAmount,
                (now - i.PaymentDueDate).Days
            ))
            .OrderByDescending(i => i.DaysOverdue)
            .ToList();

        return result;
    }

    public async Task<PaymentStatusSummaryDto> GetPaymentStatusSummaryAsync()
    {
        var invoices = await _context.Invoices
            .AsNoTracking()
            .Include(i => i.Payment)
            .Where(i => i.IsConsistent)
            .ToListAsync();

        var now = DateTime.UtcNow.Date;

        var statusGroups = invoices
            .GroupBy(i => CalculatePaymentStatus(i, now))
            .Select(g => new
            {
                Status = g.Key,
                Count = g.Count(),
                Amount = g.Sum(i => i.TotalAmount)
            })
            .ToList();

        var totalInvoices = invoices.Count;
        var totalAmount = invoices.Sum(i => i.TotalAmount);

        var breakdown = new Dictionary<string, PaymentStatusBreakdownDto>();

        foreach (PaymentStatus status in Enum.GetValues<PaymentStatus>())
        {
            var group = statusGroups.FirstOrDefault(g => g.Status == status);
            var count = group?.Count ?? 0;
            var amount = group?.Amount ?? 0;
            var percentage = totalInvoices > 0 ? (count / (double)totalInvoices) * 100 : 0;

            breakdown[status.ToString()] = new PaymentStatusBreakdownDto(
                count,
                amount,
                Math.Round(percentage, 2)
            );
        }

        return new PaymentStatusSummaryDto(
            totalInvoices,
            totalAmount,
            breakdown
        );
    }

    public async Task<List<InconsistentInvoiceDto>> GetInconsistentInvoicesAsync()
    {
        var invoices = await _context.Invoices
            .AsNoTracking()
            .Include(i => i.Items)
            .Where(i => !i.IsConsistent)
            .ToListAsync();

        var result = invoices.Select(i =>
        {
            var itemsTotal = i.Items.Sum(item => item.Subtotal);
            var difference = i.TotalAmount - itemsTotal;

            return new InconsistentInvoiceDto(
                i.Id,
                i.InvoiceNumber,
                i.CustomerName,
                i.InvoiceDate,
                i.TotalAmount,
                itemsTotal,
                difference
            );
        })
        .OrderBy(i => i.InvoiceNumber)
        .ToList();

        return result;
    }

    private PaymentStatus CalculatePaymentStatus(Invoice invoice, DateTime now)
    {
        if (invoice.Payment != null)
        {
            return PaymentStatus.Paid;
        }

        if (now > invoice.PaymentDueDate)
        {
            return PaymentStatus.Overdue;
        }

        return PaymentStatus.Pending;
    }
}
