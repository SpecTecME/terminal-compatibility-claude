using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TscPlatform.Api.Models.Phase1;

[Table("VesselTypeFuelTankPolicy")]
public class VesselTypeFuelTankPolicy : BaseEntity
{
    [Required]
    public int VesselTypeRefId { get; set; }

    [Required]
    [MaxLength(36)]
    public string VesselTypeRefPublicId { get; set; } = string.Empty;

    [Required]
    public int FuelTypeRefId { get; set; }

    [Required]
    [MaxLength(36)]
    public string FuelTypeRefPublicId { get; set; } = string.Empty;

    [Required]
    [MaxLength(30)]
    public string TankRole { get; set; } = string.Empty;

    public bool IsAllowed { get; set; } = true;
    public bool IsDefault { get; set; } = false;
    public int? MinCount { get; set; }
    public int? RecommendedCount { get; set; }
    public string? Notes { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation
    [ForeignKey(nameof(VesselTypeRefId))]
    public VesselTypeRef VesselTypeRef { get; set; } = null!;

    [ForeignKey(nameof(FuelTypeRefId))]
    public FuelTypeRef FuelTypeRef { get; set; } = null!;
}
