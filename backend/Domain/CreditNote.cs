namespace InvoiceManagement.Api.Domain;

public class CreditNote
{
    public Guid Id { get; set; }
    public Guid InvoiceId { get; set; }
    public int CreditNoteNumber { get; set; }
    public DateTime CreditNoteDate { get; set; }
    public decimal Amount { get; set; }
    public DateTime CreatedAtUtc { get; set; }

    // Navigation property
    public Invoice Invoice { get; set; } = null!;
}
