using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TscPlatform.Api.Models.Phase3;

[Table("TerminalDocumentRequirement")]
public class TerminalDocumentRequirement : BaseEntity
{
    /// <summary>FK reference to Terminal via publicId</summary>
    [Required]
    [MaxLength(36)]
    public string TerminalPublicId { get; set; } = string.Empty;

    /// <summary>Legacy Base44 reference to Terminal</summary>
    [MaxLength(100)]
    public string? TerminalId { get; set; }

    /// <summary>FK reference to Berth via publicId — null means terminal-wide</summary>
    [MaxLength(36)]
    public string? BerthPublicId { get; set; }

    /// <summary>Legacy Base44 reference to Berth</summary>
    [MaxLength(100)]
    public string? BerthId { get; set; }

    /// <summary>FK reference to DocumentType via publicId</summary>
    [Required]
    [MaxLength(36)]
    public string DocumentTypePublicId { get; set; } = string.Empty;

    /// <summary>Legacy Base44 reference to DocumentType</summary>
    [MaxLength(100)]
    public string? DocumentTypeId { get; set; }

    /// <summary>Terminal or Berth</summary>
    [MaxLength(20)]
    public string? AppliesLevel { get; set; }

    /// <summary>Registration, Renewal, or PreVisit</summary>
    [MaxLength(20)]
    public string? SubmissionStage { get; set; }

    public bool IsRequired { get; set; } = true;

    public DateOnly? EffectiveFrom { get; set; }

    public DateOnly? ValidTo { get; set; }

    public bool IsActive { get; set; } = true;

    public bool IsMandatory { get; set; } = true;

    public int? Priority { get; set; }

    public string? Notes { get; set; }

    public string? VesselConditionJson { get; set; }
}
