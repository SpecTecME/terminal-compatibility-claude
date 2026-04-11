using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TscPlatform.Api.Models.Phase3;

[Table("Berth")]
public class Berth : BaseEntity
{
    /// <summary>FK reference to Terminal via publicId</summary>
    [Required]
    [MaxLength(36)]
    public string TerminalPublicId { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? BerthCode { get; set; }

    [MaxLength(200)]
    public string? BerthName { get; set; }

    [MaxLength(50)]
    public string? BerthNumber { get; set; }

    [MaxLength(50)]
    public string? BerthType { get; set; }

    /// <summary>Array of ProductTypeRef publicIds (products handled at this berth)</summary>
    public string[] ProductTypeRefIds { get; set; } = Array.Empty<string>();

    public double? MaxLoa { get; set; }

    public double? MaxBeam { get; set; }

    public double? MaxDraft { get; set; }

    public double? MinCargoCapacity { get; set; }

    public double? MaxCargoCapacity { get; set; }

    public bool QmaxCapable { get; set; } = false;

    public bool QflexCapable { get; set; } = false;

    public double? MaxCargoCapacityM3 { get; set; }

    public double? MaxLoaM { get; set; }

    public double? MaxBeamM { get; set; }

    public double? MaxArrivalDraftM { get; set; }

    public double? MaxArrivalDisplacementT { get; set; }

    public string? ManifoldLimitsNotes { get; set; }

    public double? ManifoldHeightMin { get; set; }

    public double? ManifoldHeightMax { get; set; }

    public int? LoadingArmsLngCount { get; set; }

    public bool VapourReturnAvailable { get; set; } = false;

    public string? TypicalLoadingRateNotes { get; set; }

    public int? LoadingArms { get; set; }

    [MaxLength(100)]
    public string? FendersType { get; set; }

    public double? BollardsCapacity { get; set; }

    [MaxLength(200)]
    public string? Operator { get; set; }

    [MaxLength(200)]
    public string? DataSource { get; set; }

    public DateOnly? LastVerifiedDate { get; set; }

    public string? Description { get; set; }

    [MaxLength(50)]
    public string? Status { get; set; }

    public string? Notes { get; set; }

    public bool IsArchived { get; set; } = false;

    public DateTime? ArchivedAt { get; set; }

    public string? ArchivedReason { get; set; }
}
