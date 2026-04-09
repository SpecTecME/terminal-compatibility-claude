using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TscPlatform.Api.Models.Phase1;

/// <summary>
/// Links a country to a maritime zone by ISO2 code and zone publicId.
/// Uses natural key references (not numeric FKs) as defined in the schema.
/// </summary>
[Table("CountryMaritimeZone")]
public class CountryMaritimeZone : BaseEntity
{
    [Required]
    [MaxLength(2)]
    public string CountryIso2 { get; set; } = string.Empty;

    /// <summary>publicId of the MaritimeZone — soft reference by publicId (not numeric FK)</summary>
    [Required]
    [MaxLength(36)]
    public string ZonePublicId { get; set; } = string.Empty;

    /// <summary>Coastal | EEZ | High Seas</summary>
    [MaxLength(20)]
    public string? Scope { get; set; }

    public DateOnly? EffectiveFrom { get; set; }
    public DateOnly? EffectiveTo { get; set; }
    public string? Notes { get; set; }
}
