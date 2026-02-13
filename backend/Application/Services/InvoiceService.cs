
using Microsoft.EntityFrameworkCore;
using InvoiceManagement.Api.Domain;
using InvoiceManagement.Api.Infrastructure;
using InvoiceManagement.Api.Application.DTOs;
using System.Text.Json;

namespace InvoiceManagement.Api.Application.Services;

public class InvoiceService
{
    private readonly InvoiceDbContext _context;
    private readonly ILogger<InvoiceService> _logger;

    public InvoiceService(InvoiceDbContext context, ILogger<InvoiceService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<InvoiceDetailDto?> GetInvoiceByNumberAsync(int invoiceNumber)
    {
        var invoice = await _context.Invoices
            .AsNoTracking()
            .Include(i => i.Items)
            .Include(i => i.CreditNotes)
            .Include(i => i.Payment)
            .FirstOrDefaultAsync(i => i.InvoiceNumber == invoiceNumber);

        if (invoice == null)
        {
            return null;
        }

        return MapToDetailDto(invoice, DateTime.UtcNow.Date);
    }

    public async Task<ImportResultDto> ImportFromJsonAsync(string filePath)
    {
        _logger.LogInformation("Starting import from {FilePath}", filePath);

        if (!File.Exists(filePath))
        {
            throw new FileNotFoundException($"File not found: {filePath}");
        }

        // RESET: Borrar todos los datos previos
        _logger.LogWarning("Reseteando base de datos: eliminando facturas, notas de crédito y pagos existentes antes de importar nuevo JSON");
        _context.CreditNotes.RemoveRange(_context.CreditNotes);
        _context.Payments.RemoveRange(_context.Payments);
        _context.InvoiceItems.RemoveRange(_context.InvoiceItems);
        _context.Invoices.RemoveRange(_context.Invoices);
        await _context.SaveChangesAsync();

        var jsonContent = await File.ReadAllTextAsync(filePath);
        var importRoot = JsonSerializer.Deserialize<ImportRootDto>(jsonContent, 
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

        if (importRoot == null || importRoot.Invoices == null || !importRoot.Invoices.Any())
        {
            return new ImportResultDto(0, 0, 0, 0, new List<int>());
        }

        var totalRead = importRoot.Invoices.Count;
        var inserted = 0;
        var duplicates = 0;
        var inconsistent = 0;
        var duplicateNumbers = new List<int>();

        var existingInvoiceNumbers = new List<int>(); // Ya no hay facturas previas

        var now = DateTime.UtcNow;

        foreach (var importInvoice in importRoot.Invoices)
        {
            if (existingInvoiceNumbers.Contains(importInvoice.invoice_number))
            {
                duplicates++;
                duplicateNumbers.Add(importInvoice.invoice_number);
                continue;
            }

            var invoice = new Invoice
            {
                Id = Guid.NewGuid(),
                InvoiceNumber = importInvoice.invoice_number,
                InvoiceDate = DateTime.Parse(importInvoice.invoice_date).Date,
                PaymentDueDate = DateTime.Parse(importInvoice.payment_due_date).Date,
                DaysToDue = importInvoice.days_to_due,
                TotalAmount = Math.Round(importInvoice.total_amount, 2),
                CustomerRun = importInvoice.customer.customer_run,
                CustomerName = importInvoice.customer.customer_name,
                CustomerEmail = importInvoice.customer.customer_email,
                CreatedAtUtc = now,
                UpdatedAtUtc = now
            };

            // Import items
            var items = importInvoice.invoice_detail.Select(item => new InvoiceItem
            {
                Id = Guid.NewGuid(),
                InvoiceId = invoice.Id,
                ProductName = item.product_name,
                Quantity = item.quantity,
                UnitPrice = Math.Round(item.unit_price, 2),
                Subtotal = Math.Round(item.subtotal, 2)
            }).ToList();

            // Check consistency
            var itemsTotal = Math.Round(items.Sum(i => i.Subtotal), 2);
            invoice.IsConsistent = itemsTotal == invoice.TotalAmount;

            if (!invoice.IsConsistent)
            {
                inconsistent++;
                _logger.LogWarning("Invoice {InvoiceNumber} is inconsistent: Total={Total}, ItemsSum={ItemsSum}", 
                    invoice.InvoiceNumber, invoice.TotalAmount, itemsTotal);
            }

            invoice.Items = items;

            // Import credit notes if exist
            if (importInvoice.invoice_credit_note != null && importInvoice.invoice_credit_note.Any())
            {
                var creditNotes = importInvoice.invoice_credit_note.Select(cn => new CreditNote
                {
                    Id = Guid.NewGuid(),
                    InvoiceId = invoice.Id,
                    CreditNoteNumber = cn.credit_note_number,
                    CreditNoteDate = DateTime.Parse(cn.credit_note_date).Date,
                    Amount = Math.Round(cn.credit_note_amount, 2),
                    CreatedAtUtc = now
                }).ToList();

                invoice.CreditNotes = creditNotes;
            }

            // Import payment if exists
            if (importInvoice.invoice_payment != null && 
                !string.IsNullOrEmpty(importInvoice.invoice_payment.payment_date))
            {
                var payment = new Payment
                {
                    Id = Guid.NewGuid(),
                    InvoiceId = invoice.Id,
                    PaymentMethod = importInvoice.invoice_payment.payment_method,
                    Amount = invoice.TotalAmount,
                    PaidAtUtc = DateTime.Parse(importInvoice.invoice_payment.payment_date)
                };

                invoice.Payment = payment;
            }

            _context.Invoices.Add(invoice);
            inserted++;
            existingInvoiceNumbers.Add(invoice.InvoiceNumber);
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Import completed: {Inserted} inserted, {Duplicates} duplicates, {Inconsistent} inconsistent",
            inserted, duplicates, inconsistent);

        return new ImportResultDto(
            totalRead,
            inserted,
            duplicates,
            inconsistent,
            duplicateNumbers
        );
    }

    public async Task<PaginatedResultDto<InvoiceListDto>> GetInvoicesAsync(
        string? search,
        int? invoiceNumber,
        InvoiceStatus? invoiceStatus,
        PaymentStatus? paymentStatus,
        int page = 1,
        int pageSize = 20)
    {
        var query = _context.Invoices
            .AsNoTracking()
            .Include(i => i.CreditNotes)
            .Include(i => i.Payment)
            .Where(i => i.IsConsistent);

        if (!string.IsNullOrEmpty(search))
        {
            // support searching by invoice number or customer name
            if (int.TryParse(search, out var num))
            {
                query = query.Where(i => i.InvoiceNumber == num || EF.Functions.Like(i.CustomerName, $"%{search}%"));
            }
            else
            {
                query = query.Where(i => EF.Functions.Like(i.CustomerName, $"%{search}%") || EF.Functions.Like(i.InvoiceNumber.ToString(), $"%{search}%"));
            }
        }

        if (invoiceNumber.HasValue)
        {
            query = query.Where(i => i.InvoiceNumber == invoiceNumber.Value);
        }

        var invoices = await query.ToListAsync();
        var now = DateTime.UtcNow.Date;

        // Filter by calculated statuses
        var filteredInvoices = invoices.Where(invoice =>
        {
            var invStatus = CalculateInvoiceStatus(invoice);
            var payStatus = CalculatePaymentStatus(invoice, now);

            var matchesInvoiceStatus = !invoiceStatus.HasValue || invStatus == invoiceStatus.Value;
            var matchesPaymentStatus = !paymentStatus.HasValue || payStatus == paymentStatus.Value;

            return matchesInvoiceStatus && matchesPaymentStatus;
        }).ToList();

        var totalCount = filteredInvoices.Count;
        var totalPages = (int)Math.Ceiling(totalCount / (double)pageSize);

        var pagedInvoices = filteredInvoices
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(invoice => MapToListDto(invoice, now))
            .ToList();

        return new PaginatedResultDto<InvoiceListDto>(
            pagedInvoices,
            page,
            pageSize,
            totalCount,
            totalPages
        );
    }

    public async Task<InvoiceDetailDto?> GetInvoiceByIdAsync(Guid id)
    {
        var invoice = await _context.Invoices
            .AsNoTracking()
            .Include(i => i.Items)
            .Include(i => i.CreditNotes)
            .Include(i => i.Payment)
            .FirstOrDefaultAsync(i => i.Id == id);

        if (invoice == null)
        {
            return null;
        }

        return MapToDetailDto(invoice, DateTime.UtcNow.Date);
    }

    public async Task<InvoiceDetailDto> CreateCreditNoteAsync(Guid invoiceId, decimal amount, string? creditNoteNumber = null)
    {
        var invoice = await _context.Invoices
            .Include(i => i.Items)
            .Include(i => i.CreditNotes)
            .Include(i => i.Payment)
            .FirstOrDefaultAsync(i => i.Id == invoiceId);

        if (invoice == null)
        {
            throw new InvalidOperationException("Invoice not found");
        }

        if (!invoice.IsConsistent)
        {
            throw new InvalidOperationException("Cannot create credit note for inconsistent invoice");
        }

        var creditApplied = invoice.CreditNotes.Sum(cn => cn.Amount);
        var balance = invoice.TotalAmount - creditApplied;

        if (amount > balance)
        {
            throw new InvalidOperationException(
                $"Credit note amount ({amount:F2}) cannot exceed remaining balance ({balance:F2})");
        }

        // Generate credit note number (use Max with nullable to ensure translation)
        var maxNumber = await _context.CreditNotes.MaxAsync(cn => (int?)cn.CreditNoteNumber);
        var nextCreditNoteNumber = (maxNumber ?? 0) + 1;

        var creditNote = new CreditNote
        {
            Id = Guid.NewGuid(),
            InvoiceId = invoiceId,
            CreditNoteNumber = int.TryParse(creditNoteNumber, out var num) ? num : nextCreditNoteNumber,
            CreditNoteDate = DateTime.UtcNow.Date,
            Amount = Math.Round(amount, 2),
            CreatedAtUtc = DateTime.UtcNow
        };

        _context.CreditNotes.Add(creditNote);
        invoice.UpdatedAtUtc = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Credit note {CreditNoteNumber} created for invoice {InvoiceNumber}, amount: {Amount}",
            creditNote.CreditNoteNumber, invoice.InvoiceNumber, amount);

        // Reload to get updated data
        invoice = await _context.Invoices
            .Include(i => i.Items)
            .Include(i => i.CreditNotes)
            .Include(i => i.Payment)
            .FirstAsync(i => i.Id == invoiceId);

        return MapToDetailDto(invoice, DateTime.UtcNow.Date);
    }

    public async Task<InvoiceDetailDto> CreatePaymentAsync(Guid invoiceId, decimal amount, string? paymentMethod = null)
    {
        var invoice = await _context.Invoices
            .Include(i => i.Items)
            .Include(i => i.CreditNotes)
            .Include(i => i.Payment)
            .FirstOrDefaultAsync(i => i.Id == invoiceId);

        if (invoice == null)
        {
            throw new InvalidOperationException("Invoice not found");
        }

        if (!invoice.IsConsistent)
        {
            throw new InvalidOperationException("Cannot create payment for inconsistent invoice");
        }

        if (invoice.Payment != null)
        {
            throw new InvalidOperationException("Invoice already has a payment registered");
        }

        var payment = new Payment
        {
            Id = Guid.NewGuid(),
            InvoiceId = invoiceId,
            PaymentMethod = paymentMethod,
            Amount = Math.Round(amount, 2),
            PaidAtUtc = DateTime.UtcNow
        };

        _context.Payments.Add(payment);
        invoice.UpdatedAtUtc = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Payment created for invoice {InvoiceNumber}, amount: {Amount}, method: {Method}",
            invoice.InvoiceNumber, amount, paymentMethod ?? "N/A");

        // Reload to get updated data
        invoice = await _context.Invoices
            .Include(i => i.Items)
            .Include(i => i.CreditNotes)
            .Include(i => i.Payment)
            .FirstAsync(i => i.Id == invoiceId);

        return MapToDetailDto(invoice, DateTime.UtcNow.Date);
    }

    private InvoiceListDto MapToListDto(Invoice invoice, DateTime now)
    {
        var creditApplied = invoice.CreditNotes.Sum(cn => cn.Amount);
        var balance = invoice.TotalAmount - creditApplied;

        return new InvoiceListDto(
            invoice.Id,
            invoice.InvoiceNumber,
            invoice.CustomerName,
            invoice.CustomerEmail,
            invoice.InvoiceDate,
            invoice.PaymentDueDate,
            invoice.TotalAmount,
            CalculateInvoiceStatus(invoice),
            CalculatePaymentStatus(invoice, now),
            creditApplied,
            balance
        );
    }

    private InvoiceDetailDto MapToDetailDto(Invoice invoice, DateTime now)
    {
        var creditApplied = invoice.CreditNotes.Sum(cn => cn.Amount);
        var balance = invoice.TotalAmount - creditApplied;

        return new InvoiceDetailDto(
            invoice.Id,
            invoice.InvoiceNumber,
            invoice.CustomerRun,
            invoice.CustomerName,
            invoice.CustomerEmail,
            invoice.InvoiceDate,
            invoice.PaymentDueDate,
            invoice.DaysToDue,
            invoice.TotalAmount,
            invoice.IsConsistent,
            CalculateInvoiceStatus(invoice),
            CalculatePaymentStatus(invoice, now),
            creditApplied,
            balance,
            invoice.Items.Select(item => new InvoiceItemDto(
                item.Id,
                item.ProductName,
                item.Quantity,
                item.UnitPrice,
                item.Subtotal
            )).ToList(),
            invoice.CreditNotes.Select(cn => new CreditNoteDto(
                cn.Id,
                cn.CreditNoteNumber,
                cn.CreditNoteDate,
                cn.Amount
            )).ToList(),
            invoice.Payment != null ? new PaymentDto(
                invoice.Payment.Id,
                invoice.Payment.PaymentMethod,
                invoice.Payment.Amount,
                invoice.Payment.PaidAtUtc
            ) : null
        );
    }

    private InvoiceStatus CalculateInvoiceStatus(Invoice invoice)
    {
        var totalCreditNotes = invoice.CreditNotes.Sum(cn => cn.Amount);

        if (totalCreditNotes == 0)
        {
            return InvoiceStatus.Issued;
        }

        if (totalCreditNotes >= invoice.TotalAmount)
        {
            return InvoiceStatus.Cancelled;
        }

        return InvoiceStatus.Partial;
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
