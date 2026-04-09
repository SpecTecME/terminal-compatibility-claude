using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TscPlatform.Api.Models.Phase1;

[Table("DocumentTypeExternalCode")]
public class DocumentTypeExternalCode : BaseEntity
{
    [Required]
    public int DocumentTypeId { get; set; }

    [Required]
    [MaxLength(36)]
    public string DocumentTypePublicId { get; set; } = string.Empty;

    /// <summary>Cross-phase FK to Company (Phase 2). Column stored for migration portability; no nav property.</summary>
    [MaxLength(36)]
    public string? AuthorityCompanyId { get; set; }

    [MaxLength(36)]
    public string? AuthorityCompanyPublicId { get; set; }

    [Required]
    [MaxLength(100)]
    public string ExternalCode { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? ExternalName { get; set; }

    [Required]
    [MaxLength(50)]
    public string CodeType { get; set; } = string.Empty;

    public string? Notes { get; set; }
    public bool IsPrimary { get; set; } = false;
    public bool IsActive { get; set; } = true;
    public int? SortOrder { get; set; }

    // Navigation
    [ForeignKey(nameof(DocumentTypeId))]
    public DocumentType DocumentType { get; set; } = null!;
}
