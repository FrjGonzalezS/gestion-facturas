using InvoiceManagement.Api.Domain;

namespace InvoiceManagement.Api.Application.DTOs;

public record InvoiceListDto(
    Guid Id,
    int InvoiceNumber,
    string CustomerName,
    string CustomerEmail,
    DateTime InvoiceDate,
    DateTime PaymentDueDate,
    decimal TotalAmount,
    InvoiceStatus InvoiceStatus,
    PaymentStatus PaymentStatus,
    decimal CreditApplied,
    decimal Balance
);

public record InvoiceDetailDto(
    Guid Id,
    int InvoiceNumber,
    string CustomerRun,
    string CustomerName,
    string CustomerEmail,
    DateTime InvoiceDate,
    DateTime PaymentDueDate,
    int DaysToDue,
    decimal TotalAmount,
    bool IsConsistent,
    InvoiceStatus InvoiceStatus,
    PaymentStatus PaymentStatus,
    decimal CreditApplied,
    decimal Balance,
    List<InvoiceItemDto> Items,
    List<CreditNoteDto> CreditNotes,
    PaymentDto? Payment
);

public record InvoiceItemDto(
    Guid Id,
    string ProductName,
    int Quantity,
    decimal UnitPrice,
    decimal Subtotal
);

public record CreditNoteDto(
    Guid Id,
    int CreditNoteNumber,
    DateTime CreditNoteDate,
    decimal Amount
);

public record PaymentDto(
    Guid Id,
    string? PaymentMethod,
    decimal Amount,
    DateTime PaidAtUtc
);

public record ImportResultDto(
    int TotalRead,
    int Inserted,
    int Duplicates,
    int Inconsistent,
    List<int> DuplicateInvoiceNumbers
);

public record PaginatedResultDto<T>(
    List<T> Items,
    int Page,
    int PageSize,
    int TotalCount,
    int TotalPages
);

public record OverdueInvoiceDto(
    Guid Id,
    int InvoiceNumber,
    string CustomerName,
    DateTime InvoiceDate,
    DateTime PaymentDueDate,
    decimal TotalAmount,
    int DaysOverdue
);

public record PaymentStatusSummaryDto(
    int TotalInvoices,
    decimal TotalAmount,
    Dictionary<string, PaymentStatusBreakdownDto> Breakdown
);

public record PaymentStatusBreakdownDto(
    int Count,
    decimal Amount,
    double Percentage
);

public record InconsistentInvoiceDto(
    Guid Id,
    int InvoiceNumber,
    string CustomerName,
    DateTime InvoiceDate,
    decimal TotalAmount,
    decimal ItemsTotal,
    decimal Difference
);
