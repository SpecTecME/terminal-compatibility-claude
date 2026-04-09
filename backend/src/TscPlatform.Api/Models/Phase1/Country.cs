using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TscPlatform.Api.Models.Phase1;

[Table("Country")]
public class Country : BaseEntity
{
    /// <summary>ISO 3166-1 alpha-2 code (e.g., AE, US, GB) - unique</summary>
    [Required]
    [MaxLength(2)]
    public string Iso2 { get; set; } = string.Empty;

    /// <summary>ISO 3166-1 alpha-3 code (e.g., ARE, USA, GBR)</summary>
    [MaxLength(3)]
    public string? Iso3 { get; set; }

    /// <summary>English name of the country</summary>
    [Required]
    [MaxLength(100)]
    public string NameEn { get; set; } = string.Empty;

    public DateOnly? ValidFrom { get; set; }

    /// <summary>null means currently active</summary>
    public DateOnly? ValidTo { get; set; }

    public bool IsActive { get; set; } = true;

    // Navigation
    public ICollection<CountryAlias> Aliases { get; set; } = [];
}
