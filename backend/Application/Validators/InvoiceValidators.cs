using FluentValidation;
using InvoiceManagement.Api.Application.DTOs;

namespace InvoiceManagement.Api.Application.Validators;

public class CreateCreditNoteValidator : AbstractValidator<CreateCreditNoteRequest>
{
    public CreateCreditNoteValidator()
    {
        RuleFor(x => x.Amount)
            .GreaterThan(0)
            .WithMessage("Amount must be greater than 0");
    }
}

public class CreatePaymentValidator : AbstractValidator<CreatePaymentRequest>
{
    public CreatePaymentValidator()
    {
        RuleFor(x => x.Amount)
            .GreaterThan(0)
            .WithMessage("Amount must be greater than 0");
    }
}
