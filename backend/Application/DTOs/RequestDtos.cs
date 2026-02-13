namespace InvoiceManagement.Api.Application.DTOs;

public record CreateCreditNoteRequest(
    decimal Amount,
    string? CreditNoteNumber = null
);

public record CreatePaymentRequest(
    decimal Amount,
    string? PaymentMethod = null
);

// Import DTOs matching JSON structure
public record ImportRootDto(List<ImportInvoiceDto> Invoices);

public record ImportInvoiceDto(
    int invoice_number,
    string invoice_date,
    string invoice_status,
    decimal total_amount,
    int days_to_due,
    string payment_due_date,
    string payment_status,
    List<ImportItemDto> invoice_detail,
    ImportPaymentDto invoice_payment,
    List<ImportCreditNoteDto> invoice_credit_note,
    ImportCustomerDto customer
);

public record ImportItemDto(
    string product_name,
    decimal unit_price,
    int quantity,
    decimal subtotal
);

public record ImportPaymentDto(
    string? payment_method,
    string? payment_date
);

public record ImportCreditNoteDto(
    int credit_note_number,
    string credit_note_date,
    decimal credit_note_amount
);

public record ImportCustomerDto(
    string customer_run,
    string customer_name,
    string customer_email
);
