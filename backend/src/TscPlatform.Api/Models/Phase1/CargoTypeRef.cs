using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TscPlatform.Api.Models.Phase1;

[Table("CargoTypeRef")]
public class CargoTypeRef : BaseEntity
{
    [Required]
    [MaxLength(50)]
    public string Code { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    /// <summary>GAS | LIQUID_BULK | DRY_BULK | CONTAINER | RORO | PASSENGER | GENERAL | OTHER</summary>
    [Required]
    [MaxLength(20)]
    public string CargoCategory { get; set; } = string.Empty;

    /// <summary>m3 | MT | TEU | CEU | pax | lane_meters</summary>
    [Required]
    [MaxLength(20)]
    public string DefaultUnit { get; set; } = string.Empty;

    // Optional FK to ProductTypeRef (within Phase 1)
    public int? ProductTypeId { get; set; }

    [MaxLength(36)]
    public string? ProductTypePublicId { get; set; }

    public bool IsActive { get; set; } = true;
    public int? SortOrder { get; set; }
    public string? Notes { get; set; }

    // Navigation
    [ForeignKey(nameof(ProductTypeId))]
    public ProductTypeRef? ProductType { get; set; }
}
