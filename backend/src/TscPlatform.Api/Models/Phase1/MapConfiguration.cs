using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TscPlatform.Api.Models.Phase1;

[Table("MapConfiguration")]
public class MapConfiguration : BaseEntity
{
    [MaxLength(20)]
    public string MapMode { get; set; } = "BUNDLED";

    [MaxLength(500)]
    public string? PmtilesUrl { get; set; }

    [MaxLength(500)]
    public string? ExternalTileUrl { get; set; }

    public bool UseMaritimeZones { get; set; } = true;
    public bool EnableExternalGeocoding { get; set; } = false;
    public bool IsActive { get; set; } = true;
    public string? Notes { get; set; }
}
