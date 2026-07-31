using BuildFlow.Api.Domain;

namespace BuildFlow.Api.Tests;

public class DomainTests
{
    [Fact]
    public void NewDocumentStartsInProcessingStateWithVersionOne()
    {
        var document = new ProjectDocument();

        Assert.Equal(DocumentStatus.Processing, document.Status);
        Assert.Equal(1, document.CurrentVersion);
        Assert.NotEqual(Guid.Empty, document.Id);
    }

    [Fact]
    public void NewApprovalStartsPending()
    {
        var approval = new ApprovalRequest();

        Assert.Equal(ApprovalDecision.Pending, approval.Decision);
        Assert.NotEqual(Guid.Empty, approval.Id);
    }
}
