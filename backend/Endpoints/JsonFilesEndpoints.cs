using Microsoft.AspNetCore.Mvc;
using InvoiceManagement.Api.Application.Services;

namespace InvoiceManagement.Api.Endpoints;

public static class JsonFilesEndpoints
{
    public static void MapJsonFilesEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/json-files")
            .WithTags("JsonFiles")
            .WithOpenApi();

        group.MapGet("/", ListJsonFilesAsync)
            .WithName("ListJsonFiles")
            .WithDescription("List JSON files in configured folder")
            .Produces<string[]>(StatusCodes.Status200OK);

        group.MapGet("/{name}", ReadJsonFileAsync)
            .WithName("ReadJsonFile")
            .WithDescription("Read a JSON file content by name")
            .Produces<string>(StatusCodes.Status200OK)
            .Produces<ProblemDetails>(StatusCodes.Status404NotFound);

        group.MapPost("/upload", UploadJsonFileAsync)
            .WithName("UploadJsonFile")
            .WithDescription("Upload a JSON file to the configured folder")
            .Accepts<IFormFile>("multipart/form-data")
            .Produces(StatusCodes.Status201Created)
            .Produces<ProblemDetails>(StatusCodes.Status400BadRequest);

        group.MapGet("/last-imported", GetLastImportedJsonAsync)
            .WithName("GetLastImportedJson")
            .WithDescription("Get the name of the last imported JSON file")
            .Produces<string>(StatusCodes.Status200OK);
    }

    private static Task<IResult> ListJsonFilesAsync()
    {
        var folder = Path.Combine(AppContext.BaseDirectory, "invoices-json");
        Directory.CreateDirectory(folder);

        if (!Directory.Exists(folder))
        {
            return Task.FromResult(Results.Ok(Array.Empty<string>()) as IResult);
        }

        var files = Directory.GetFiles(folder, "*.json")
            .Select(Path.GetFileName)
            .ToArray();

        return Task.FromResult(Results.Ok(files) as IResult);
    }

    private static async Task<IResult> ReadJsonFileAsync([FromRoute] string name)
    {
        var folder = Path.Combine(AppContext.BaseDirectory, "invoices-json");
        Directory.CreateDirectory(folder);
        var safeName = Path.GetFileName(name);
        var filePath = Path.Combine(folder, safeName);

        if (!File.Exists(filePath))
        {
            return Results.Problem(detail: $"File not found: {safeName}", statusCode: StatusCodes.Status404NotFound, title: "File Not Found");
        }

        var content = await File.ReadAllTextAsync(filePath);
        return Results.Content(content, "application/json");
    }

    private static readonly string LastImportedFilePath = Path.Combine(AppContext.BaseDirectory, "invoices-json", ".last-imported.txt");

    private static async Task<IResult> GetLastImportedJsonAsync()
    {
        if (File.Exists(LastImportedFilePath))
        {
            var name = await File.ReadAllTextAsync(LastImportedFilePath);
            return Results.Ok(name.Trim());
        }
        return Results.Ok("");
    }

    private static async Task SetLastImportedJsonAsync(string fileName)
    {
        await File.WriteAllTextAsync(LastImportedFilePath, fileName);
    }

    private static async Task<IResult> UploadJsonFileAsync(HttpRequest request)
    {
        if (!request.HasFormContentType)
        {
            return Results.Problem(detail: "Expected multipart/form-data", statusCode: StatusCodes.Status400BadRequest, title: "Bad Request");
        }

        var form = await request.ReadFormAsync();
        var file = form.Files.FirstOrDefault();
        if (file == null)
        {
            return Results.Problem(detail: "No file provided", statusCode: StatusCodes.Status400BadRequest, title: "Bad Request");
        }

        var folder = Path.Combine(AppContext.BaseDirectory, "invoices-json");
        Directory.CreateDirectory(folder);
        Directory.CreateDirectory(folder);

        var safeName = Path.GetFileName(file.FileName);
        var filePath = Path.Combine(folder, safeName);

        using (var stream = File.Create(filePath))
        {
            await file.CopyToAsync(stream);
        }

        await SetLastImportedJsonAsync(safeName);
        return Results.Created($"/api/json-files/{safeName}", new { fileName = safeName });
    }
}
