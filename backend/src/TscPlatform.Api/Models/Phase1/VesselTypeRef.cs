using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TscPlatform.Api.Models.Phase1;

[Table("VesselTypeRef")]
public class VesselTypeRef : BaseEntity
{
    [Required]
    [MaxLength(100)]
    public string PrimaryType { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string SubType { get; set; } = string.Empty;

    /// <summary>DWT | TEU | m3 | pax | LOA_m | BHP | BP | volume | tonnes | lane_meters | CEU | class</summary>
    [MaxLength(20)]
    public string? SizeMetric { get; set; }

    [MaxLength(100)]
    public string? TypicalSizeRange { get; set; }

    public string? DefiningCharacteristics { get; set; }

    /// <summary>Comma-separated capability section labels</summary>
    public string? CapabilitiesSections { get; set; }

    public int? SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
}
