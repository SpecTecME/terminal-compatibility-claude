using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TscPlatform.Api.Models.Phase1;

[Table("IssuingAuthority")]
public class IssuingAuthority : BaseEntity
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    [Column("authority_type")]
    public string AuthorityType { get; set; } = string.Empty;

    public int? CountryId { get; set; }

    [MaxLength(36)]
    public string? CountryPublicId { get; set; }

    /// <summary>Cross-phase FK to Company (Phase 2). Column stored for migration portability; no nav property.</summary>
    [MaxLength(36)]
    public string? CompanyId { get; set; }

    [MaxLength(36)]
    public string? CompanyPublicId { get; set; }

    [MaxLength(200)]
    [Column("contact_email")]
    public string? ContactEmail { get; set; }

    [MaxLength(500)]
    public string? Website { get; set; }

    public string? Notes { get; set; }

    // Navigation
    [ForeignKey(nameof(CountryId))]
    public Country? Country { get; set; }
}
