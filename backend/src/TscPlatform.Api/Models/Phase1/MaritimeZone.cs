using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TscPlatform.Api.Models.Phase1;

[Table("MaritimeZone")]
public class MaritimeZone : BaseEntity
{
    [Required]
    [MaxLength(50)]
    public string Code { get; set; } = string.Empty;

    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    /// <summary>ECA_SECA | ECA_NECA | MARPOL_SPECIAL_AREA | PSSA | WAR_RISK | PIRACY_HRA | COMPANY_TRADING_AREA</summary>
    [Required]
    [MaxLength(50)]
    public string ZoneType { get; set; } = string.Empty;

    /// <summary>IMO | EU | US_EPA | Company | Other</summary>
    [MaxLength(20)]
    public string? Authority { get; set; }

    public DateOnly? EffectiveFrom { get; set; }
    public DateOnly? EffectiveTo { get; set; }

    /// <summary>Active | Planned | Retired</summary>
    [MaxLength(20)]
    public string Status { get; set; } = "Active";

    public bool IsActive { get; set; } = true;
    public int? DisplayOrder { get; set; }

    [MaxLength(7)]
    public string? Color { get; set; }

    public double? FillOpacity { get; set; }
    public double? StrokeOpacity { get; set; }
    public double? StrokeWeight { get; set; }

    /// <summary>Polygon | MultiPolygon | BBox</summary>
    [MaxLength(20)]
    public string? GeometryType { get; set; }

    /// <summary>GeoJSON FeatureCollection as text</summary>
    public string? GeoJson { get; set; }

    public string? Notes { get; set; }
}
