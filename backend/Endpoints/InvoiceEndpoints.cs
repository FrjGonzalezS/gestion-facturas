using Microsoft.AspNetCore.Mvc;
using FluentValidation;
using InvoiceManagement.Api.Application.Services;
using InvoiceManagement.Api.Application.DTOs;
using InvoiceManagement.Api.Domain;

namespace InvoiceManagement.Api.Endpoints;

public static class InvoiceEndpoints
{
    public static void MapInvoiceEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/invoices")
            .WithTags("Invoices")
            .WithOpenApi();

        group.MapPost("/import", ImportInvoicesAsync)
            .WithName("ImportInvoices")
            .WithDescription("Import invoices from bd_exam_invoices.json file")
            .Produces<ImportResultDto>(StatusCodes.Status200OK)
            .Produces<ProblemDetails>(StatusCodes.Status400BadRequest);

        group.MapGet("", GetInvoicesAsync)
            .WithName("GetInvoices")
            .WithDescription("Get paginated list of consistent invoices with filtering")
            .Produces<PaginatedResultDto<InvoiceListDto>>(StatusCodes.Status200OK);

        group.MapGet("{id:guid}", GetInvoiceByIdAsync)
            .WithName("GetInvoiceById")
            .WithDescription("Get invoice details by ID")
            .Produces<InvoiceDetailDto>(StatusCodes.Status200OK)
            .Produces<ProblemDetails>(StatusCodes.Status404NotFound);

        group.MapGet("by-number/{invoiceNumber:int}", GetInvoiceByNumberAsync)
            .WithName("GetInvoiceByNumber")
            .WithDescription("Get invoice details by invoice number")
            .Produces<InvoiceDetailDto>(StatusCodes.Status200OK)
            .Produces<ProblemDetails>(StatusCodes.Status404NotFound);

        group.MapPost("{id:guid}/credit-notes", CreateCreditNoteAsync)
            .WithName("CreateCreditNote")
            .WithDescription("Create a credit note for an invoice")
            .Produces<InvoiceDetailDto>(StatusCodes.Status201Created)
            .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
            .Produces<ProblemDetails>(StatusCodes.Status404NotFound);

        group.MapPost("{id:guid}/payments", CreatePaymentAsync)
            .WithName("CreatePayment")
            .WithDescription("Register a payment for an invoice")
            .Produces<InvoiceDetailDto>(StatusCodes.Status201Created)
            .Produces<ProblemDetails>(StatusCodes.Status400BadRequest)
            .Produces<ProblemDetails>(StatusCodes.Status404NotFound);
    }

    private static async Task<IResult> GetInvoiceByNumberAsync(
        int invoiceNumber,
        InvoiceService invoiceService)
    {
        var invoice = await invoiceService.GetInvoiceByNumberAsync(invoiceNumber);
        if (invoice == null)
        {
            return Results.Problem(
                detail: $"Invoice with number {invoiceNumber} not found",
                statusCode: StatusCodes.Status404NotFound,
                title: "Invoice Not Found"
            );
        }
        return Results.Ok(invoice);
    }

    private static async Task<IResult> ImportInvoicesAsync(
        InvoiceService invoiceService,
        ILogger<Program> logger,
        [FromQuery] string? fileName)
    {
        try
        {
            var baseFolder = Path.Combine(AppContext.BaseDirectory, "invoices-json");
            Directory.CreateDirectory(baseFolder);

            string filePath;
            if (!string.IsNullOrEmpty(fileName))
            {
                var safeName = Path.GetFileName(fileName);
                filePath = Path.Combine(baseFolder, safeName);
            }
            else
            {
                filePath = Path.Combine(baseFolder, "bd_exam_invoices.json");
            }

            // Guardar el nombre del último archivo importado
            var lastImportedPath = Path.Combine(baseFolder, ".last-imported.txt");
            await File.WriteAllTextAsync(lastImportedPath, Path.GetFileName(filePath));

            var result = await invoiceService.ImportFromJsonAsync(filePath);
            return Results.Ok(result);
        }
        catch (FileNotFoundException ex)
        {
            logger.LogError(ex, "Import file not found");
            return Results.Problem(
                detail: ex.Message,
                statusCode: StatusCodes.Status400BadRequest,
                title: "File Not Found"
            );
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error importing invoices");
            return Results.Problem(
                detail: ex.Message,
                statusCode: StatusCodes.Status500InternalServerError,
                title: "Import Error"
            );
        }
    }

    private static async Task<IResult> GetInvoicesAsync(
        InvoiceService invoiceService,
        [FromQuery] string? search,
        [FromQuery] int? invoiceNumber,
        [FromQuery] InvoiceStatus? invoiceStatus,
        [FromQuery] PaymentStatus? paymentStatus,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        if (page < 1) page = 1;
        if (pageSize < 1 || pageSize > 1000) pageSize = 20;

        var result = await invoiceService.GetInvoicesAsync(
            search,
            invoiceNumber,
            invoiceStatus,
            paymentStatus,
            page,
            pageSize
        );

        return Results.Ok(result);
    }

    private static async Task<IResult> GetInvoiceByIdAsync(
        Guid id,
        InvoiceService invoiceService)
    {
        var invoice = await invoiceService.GetInvoiceByIdAsync(id);

        if (invoice == null)
        {
            return Results.Problem(
                detail: $"Invoice with ID {id} not found",
                statusCode: StatusCodes.Status404NotFound,
                title: "Invoice Not Found"
            );
        }

        return Results.Ok(invoice);
    }

    private static async Task<IResult> CreateCreditNoteAsync(
        Guid id,
        [FromBody] CreateCreditNoteRequest request,
        InvoiceService invoiceService,
        IValidator<CreateCreditNoteRequest> validator,
        ILogger<Program> logger)
    {
        var validationResult = await validator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            return Results.ValidationProblem(validationResult.ToDictionary());
        }

        try
        {
            var invoice = await invoiceService.CreateCreditNoteAsync(id, request.Amount, request.CreditNoteNumber);
            return Results.Created($"/api/invoices/{id}", invoice);
        }
        catch (InvalidOperationException ex)
        {
            logger.LogWarning(ex, "Invalid operation when creating credit note");
            return Results.Problem(
                detail: ex.Message,
                statusCode: StatusCodes.Status400BadRequest,
                title: "Invalid Operation"
            );
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error creating credit note");
            return Results.Problem(
                detail: ex.Message,
                statusCode: StatusCodes.Status500InternalServerError,
                title: "Error Creating Credit Note"
            );
        }
    }

    private static async Task<IResult> CreatePaymentAsync(
        Guid id,
        [FromBody] CreatePaymentRequest request,
        InvoiceService invoiceService,
        IValidator<CreatePaymentRequest> validator,
        ILogger<Program> logger)
    {
        var validationResult = await validator.ValidateAsync(request);
        if (!validationResult.IsValid)
        {
            return Results.ValidationProblem(validationResult.ToDictionary());
        }

        try
        {
            var invoice = await invoiceService.CreatePaymentAsync(id, request.Amount, request.PaymentMethod);
            return Results.Created($"/api/invoices/{id}", invoice);
        }
        catch (InvalidOperationException ex)
        {
            logger.LogWarning(ex, "Invalid operation when creating payment");
            return Results.Problem(
                detail: ex.Message,
                statusCode: StatusCodes.Status400BadRequest,
                title: "Invalid Operation"
            );
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error creating payment");
            return Results.Problem(
                detail: ex.Message,
                statusCode: StatusCodes.Status500InternalServerError,
                title: "Error Creating Payment"
            );
        }
    }
}
