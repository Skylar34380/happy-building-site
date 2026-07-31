using System.Security.Cryptography;
using Azure.Storage.Blobs;

namespace BuildFlow.Api.Services;

public sealed class BlobDocumentStorage(IConfiguration configuration)
{
    private const string ContainerName = "buildflow-documents";

    public async Task<(string BlobUrl, string Sha256)> StoreAsync(IFormFile file, Guid projectId, Guid documentId, int version)
    {
        await using var input = file.OpenReadStream();
        var hash = Convert.ToHexString(await SHA256.HashDataAsync(input)).ToLowerInvariant();
        input.Position = 0;

        var connectionString = configuration["AzureStorage:ConnectionString"];
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            return ($"local://{projectId}/{documentId}/v{version}/{file.FileName}", hash);
        }

        var container = new BlobContainerClient(connectionString, ContainerName);
        await container.CreateIfNotExistsAsync();
        var safeName = Path.GetFileName(file.FileName).Replace(" ", "-");
        var blob = container.GetBlobClient($"{projectId}/{documentId}/v{version}/{safeName}");
        await blob.UploadAsync(input, overwrite: true);
        return (blob.Uri.ToString(), hash);
    }
}
