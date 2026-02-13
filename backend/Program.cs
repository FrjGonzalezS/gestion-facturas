using Microsoft.EntityFrameworkCore;
using FluentValidation;
using InvoiceManagement.Api.Infrastructure;
using InvoiceManagement.Api.Application.Services;
using InvoiceManagement.Api.Application.Validators;
using InvoiceManagement.Api.Endpoints;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new()
    {
        Title = "Invoice Management API",
        Version = "v1",
        Description = "API for managing invoices, credit notes, and payments with comprehensive reporting"
    });
});

// Database
builder.Services.AddDbContext<InvoiceDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// Services
builder.Services.AddScoped<InvoiceService>();
builder.Services.AddScoped<ReportService>();

// Validators
builder.Services.AddValidatorsFromAssemblyContaining<CreateCreditNoteValidator>();

// CORS (if needed)
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Problem Details
builder.Services.AddProblemDetails();

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Invoice Management API v1");
        options.RoutePrefix = string.Empty; // Swagger UI at root
    });
}

app.UseHttpsRedirection();
app.UseCors();

// Map endpoints
app.MapInvoiceEndpoints();
app.MapReportEndpoints();
app.MapJsonFilesEndpoints();

// Health check
app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }))
    .WithName("HealthCheck")
    .WithTags("Health")
    .WithOpenApi();

// Ensure database is created
using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<InvoiceDbContext>();
    context.Database.EnsureCreated();
}

app.Run();
