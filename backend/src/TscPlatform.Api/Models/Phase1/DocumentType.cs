using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TscPlatform.Api.Models.Phase1;

[Table("DocumentType")]
public class DocumentType : BaseEntity
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? Code { get; set; }

    /// <summary>PostgreSQL text[] — alternative search terms and industry abbreviations</summary>
    public string[] SearchAliases { get; set; } = Array.Empty<string>();

    public int? CategoryId { get; set; }

    [MaxLength(36)]
    public string? CategoryPublicId { get; set; }

    [MaxLength(20)]
    public string? AppliesTo { get; set; }

    [MaxLength(50)]
    public string? DocumentValidityType { get; set; }

    public bool IsExpiryRequired { get; set; } = false;
    public int? DefaultValidityDuration { get; set; }

    [MaxLength(10)]
    public string? ValidityUnit { get; set; }

    public int? ReminderLeadTime { get; set; }

    [MaxLength(10)]
    public string? ReminderUnit { get; set; }

    [MaxLength(100)]
    public string? IssuingAuthorityDefault { get; set; }

    /// <summary>PostgreSQL text[] — allowed issuing authority types</summary>
    public string[] AllowedIssuers { get; set; } = Array.Empty<string>();

    public bool IsActive { get; set; } = true;
    public int? SortOrder { get; set; }
    public string? Description { get; set; }
    public string? Notes { get; set; }

    // Navigation
    [ForeignKey(nameof(CategoryId))]
    public DocumentCategory? Category { get; set; }

    public ICollection<DocumentTypeExternalCode> ExternalCodes { get; set; } = new List<DocumentTypeExternalCode>();
}
