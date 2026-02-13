using Microsoft.EntityFrameworkCore;
using InvoiceManagement.Api.Domain;

namespace InvoiceManagement.Api.Infrastructure;

public class InvoiceDbContext : DbContext
{
    public InvoiceDbContext(DbContextOptions<InvoiceDbContext> options) : base(options)
    {
    }

    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<InvoiceItem> InvoiceItems => Set<InvoiceItem>();
    public DbSet<CreditNote> CreditNotes => Set<CreditNote>();
    public DbSet<Payment> Payments => Set<Payment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Invoice configuration
        modelBuilder.Entity<Invoice>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.InvoiceNumber).IsUnique();
            entity.Property(e => e.CustomerRun).IsRequired().HasMaxLength(50);
            entity.Property(e => e.CustomerName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.CustomerEmail).IsRequired().HasMaxLength(200);
            entity.Property(e => e.TotalAmount).HasPrecision(18, 2);
            entity.Property(e => e.InvoiceDate).HasColumnType("date");
            entity.Property(e => e.PaymentDueDate).HasColumnType("date");

            entity.HasMany(e => e.Items)
                .WithOne(i => i.Invoice)
                .HasForeignKey(i => i.InvoiceId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(e => e.CreditNotes)
                .WithOne(c => c.Invoice)
                .HasForeignKey(c => c.InvoiceId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Payment)
                .WithOne(p => p.Invoice)
                .HasForeignKey<Payment>(p => p.InvoiceId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // InvoiceItem configuration
        modelBuilder.Entity<InvoiceItem>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.ProductName).IsRequired().HasMaxLength(500);
            entity.Property(e => e.UnitPrice).HasPrecision(18, 2);
            entity.Property(e => e.Subtotal).HasPrecision(18, 2);
        });

        // CreditNote configuration
        modelBuilder.Entity<CreditNote>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Amount).HasPrecision(18, 2);
            entity.Property(e => e.CreditNoteDate).HasColumnType("date");
        });

        // Payment configuration
        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Amount).HasPrecision(18, 2);
            entity.Property(e => e.PaymentMethod).HasMaxLength(100);
        });
    }
}
