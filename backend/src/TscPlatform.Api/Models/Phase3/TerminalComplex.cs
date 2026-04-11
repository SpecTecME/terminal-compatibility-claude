using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TscPlatform.Api.Models.Phase3;

[Table("TerminalComplex")]
public class TerminalComplex : BaseEntity
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? Code { get; set; }

    /// <summary>Base44 ObjectId of the linked Country (legacy reference)</summary>
    [MaxLength(100)]
    public string? CountryId { get; set; }

    [MaxLength(36)]
    public string? CountryPublicId { get; set; }

    [MaxLength(100)]
    public string? Region { get; set; }

    [MaxLength(100)]
    public string? City { get; set; }

    public string? Address { get; set; }

    public double? Latitude { get; set; }

    public double? Longitude { get; set; }

    [MaxLength(200)]
    public string? OperatorAuthority { get; set; }

    public string? Notes { get; set; }

    public bool IsActive { get; set; } = true;
}
