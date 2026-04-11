using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TscPlatform.Api.Models.Phase2;

[Table("Contact")]
public class Contact : BaseEntity
{
    public bool IsGroupEmail { get; set; }

    [MaxLength(300)]
    public string? GroupName { get; set; }

    [MaxLength(100)]
    public string? FirstName { get; set; }

    [MaxLength(100)]
    public string? LastName { get; set; }

    [MaxLength(100)]
    public string? PreferredName { get; set; }

    [MaxLength(200)]
    public string? Email { get; set; }

    [MaxLength(50)]
    public string? PhoneMobile { get; set; }

    [MaxLength(50)]
    public string? PhoneOffice { get; set; }

    [MaxLength(50)]
    public string? Whatsapp { get; set; }

    [MaxLength(50)]
    public string? PreferredContactMethod { get; set; }

    [MaxLength(100)]
    public string? Timezone { get; set; }

    public int? CompanyId { get; set; }

    [MaxLength(36)]
    public string? CompanyPublicId { get; set; }

    public int? OfficeId { get; set; }

    [MaxLength(36)]
    public string? OfficePublicId { get; set; }

    public int? CountryId { get; set; }

    [MaxLength(36)]
    public string? CountryPublicId { get; set; }

    public int? TerminalId { get; set; }

    [MaxLength(36)]
    public string? TerminalPublicId { get; set; }

    [MaxLength(200)]
    public string? JobTitle { get; set; }

    [MaxLength(100)]
    public string? Department { get; set; }

    [MaxLength(200)]
    public string? Location { get; set; }

    public DateOnly? DateOfBirth { get; set; }

    [MaxLength(100)]
    public string? ReligionOrObservance { get; set; }

    public string? ObservanceNotes { get; set; }

    [MaxLength(50)]
    public string? CriticalRole { get; set; } = "None";

    public bool IsActive { get; set; } = true;

    public string? Notes { get; set; }
}
