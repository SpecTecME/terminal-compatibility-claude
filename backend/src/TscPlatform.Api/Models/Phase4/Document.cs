using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace TscPlatform.Api.Models.Phase4;

[Table("Document")]
public class Document : BaseEntity
{
    [JsonPropertyName("vessel_id")]
    public int? VesselId { get; set; }

    public string? VesselPublicId { get; set; }

    public int? DocumentTypeId { get; set; }
    public string? DocumentTypePublicId { get; set; }

    public int? TerminalId { get; set; }
    public string? TerminalPublicId { get; set; }

    public int? BerthId { get; set; }
    public string? BerthPublicId { get; set; }

    public int? TerminalFormId { get; set; }
    public string? TerminalFormPublicId { get; set; }

    public DateOnly? IntendedVisitDate { get; set; }

    [JsonPropertyName("document_name")]
    public string? DocumentName { get; set; }

    /// <summary>Legacy field — deprecated, read-only.</summary>
    [JsonPropertyName("document_type")]
    public string? LegacyDocumentType { get; set; }

    public string? Category { get; set; }

    [JsonPropertyName("file_url")]
    public string? FileUrl { get; set; }

    [JsonPropertyName("issue_date")]
    public DateOnly? IssueDate { get; set; }

    [JsonPropertyName("expiry_date")]
    public DateOnly? ExpiryDate { get; set; }

    /// <summary>Legacy field — deprecated, read-only.</summary>
    [JsonPropertyName("issuing_authority")]
    public string? LegacyIssuingAuthority { get; set; }

    public int? IssuingAuthorityId { get; set; }
    public string? IssuingAuthorityPublicId { get; set; }

    [JsonPropertyName("reference_number")]
    public string? ReferenceNumber { get; set; }

    public string Status { get; set; } = "Valid";
    public bool IsActive { get; set; } = true;
    public string? Notes { get; set; }
}
