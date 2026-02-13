namespace InvoiceManagement.Api.Domain;

public class Payment
{
    public Guid Id { get; set; }
    public Guid InvoiceId { get; set; }
    public string? PaymentMethod { get; set; }
    public decimal Amount { get; set; }
    public DateTime PaidAtUtc { get; set; }

    // Navigation property
    public Invoice Invoice { get; set; } = null!;
}
