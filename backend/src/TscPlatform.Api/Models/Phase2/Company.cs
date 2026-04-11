using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TscPlatform.Api.Models.Phase2;

[Table("Company")]
public class Company : BaseEntity
{
    [Required]
    [MaxLength(300)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(500)]
    public string? LegalName { get; set; }

    [MaxLength(100)]
    public string? Type { get; set; }

    public int? CountryId { get; set; }

    [MaxLength(36)]
    public string? CountryPublicId { get; set; }

    [MaxLength(50)]
    public string? Phone { get; set; }

    [MaxLength(200)]
    public string? Email { get; set; }

    [MaxLength(500)]
    public string? Website { get; set; }

    [MaxLength(500)]
    public string? HqAddressLine1 { get; set; }

    [MaxLength(200)]
    public string? HqCity { get; set; }

    [MaxLength(20)]
    public string? HqPostalCode { get; set; }

    public int? HqCountryId { get; set; }

    [MaxLength(36)]
    public string? HqCountryPublicId { get; set; }

    public bool IacsMember { get; set; }

    public string? Notes { get; set; }

    public bool IsActive { get; set; } = true;

    public int? SortOrder { get; set; }

    public int? MainContactId { get; set; }

    [MaxLength(36)]
    public string? MainContactPublicId { get; set; }
}
