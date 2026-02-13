namespace InvoiceManagement.Api.Domain;

public enum InvoiceStatus
{
    Issued,
    Partial,
    Cancelled
}

public enum PaymentStatus
{
    Pending,
    Paid,
    Overdue
}
