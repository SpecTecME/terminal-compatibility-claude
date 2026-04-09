using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TscPlatform.Api.Models.Phase1;

[Table("VesselTypeCargoPolicy")]
public class VesselTypeCargoPolicy : BaseEntity
{
    [Required]
    public int VesselTypeRefId { get; set; }

    [Required]
    [MaxLength(36)]
    public string VesselTypeRefPublicId { get; set; } = string.Empty;

    [Required]
    public int CargoTypeRefId { get; set; }

    [Required]
    [MaxLength(36)]
    public string CargoTypeRefPublicId { get; set; } = string.Empty;

    public bool IsAllowed { get; set; } = true;
    public bool IsDefault { get; set; } = false;
    public decimal? DefaultCapacityValue { get; set; }

    [MaxLength(20)]
    public string? DefaultCapacityUnit { get; set; }

    [MaxLength(20)]
    public string? CapacityBasis { get; set; }

    public string? Notes { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation
    [ForeignKey(nameof(VesselTypeRefId))]
    public VesselTypeRef VesselTypeRef { get; set; } = null!;

    [ForeignKey(nameof(CargoTypeRefId))]
    public CargoTypeRef CargoTypeRef { get; set; } = null!;
}
