namespace InvoiceManagement.Api.Domain;

public class Invoice
{
    public Guid Id { get; set; }
    public int InvoiceNumber { get; set; }
    public DateTime InvoiceDate { get; set; }
    public DateTime PaymentDueDate { get; set; }
    public int DaysToDue { get; set; }
    public decimal TotalAmount { get; set; }
    public bool IsConsistent { get; set; }
    public DateTime CreatedAtUtc { get; set; }
    public DateTime UpdatedAtUtc { get; set; }

    // Customer info
    public string CustomerRun { get; set; } = string.Empty;
    public string CustomerName { get; set; } = string.Empty;
    public string CustomerEmail { get; set; } = string.Empty;

    // Navigation properties
    public ICollection<InvoiceItem> Items { get; set; } = new List<InvoiceItem>();
    public ICollection<CreditNote> CreditNotes { get; set; } = new List<CreditNote>();
    public Payment? Payment { get; set; }
}
