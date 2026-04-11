using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TscPlatform.Api.Models.Phase3;

[Table("Terminal")]
public class Terminal : BaseEntity
{
    [Required]
    [MaxLength(200)]
    public string Name { get; set; } = string.Empty;

    [MaxLength(200)]
    public string? Port { get; set; }

    /// <summary>Base44 ObjectId of the linked Country (legacy reference)</summary>
    [MaxLength(100)]
    public string? CountryId { get; set; }

    [MaxLength(36)]
    public string? CountryPublicId { get; set; }

    [MaxLength(2)]
    public string? LegacyCountryCode { get; set; }

    [MaxLength(100)]
    public string? LegacyCountryName { get; set; }

    /// <summary>Legacy Base44 Site/Complex reference</summary>
    [MaxLength(100)]
    public string? SiteId { get; set; }

    [MaxLength(36)]
    public string? SitePublicId { get; set; }

    [MaxLength(100)]
    public string? TerminalComplexId { get; set; }

    [MaxLength(36)]
    public string? TerminalComplexPublicId { get; set; }

    [MaxLength(100)]
    public string? ProductTypeRefId { get; set; }

    [MaxLength(36)]
    public string? ProductTypeRefPublicId { get; set; }

    /// <summary>Legacy Base44 TerminalType reference</summary>
    [MaxLength(100)]
    public string? TerminalTypeId { get; set; }

    [MaxLength(36)]
    public string? TerminalTypePublicId { get; set; }

    public double? Latitude { get; set; }

    public double? Longitude { get; set; }

    /// <summary>Import / Export / Both</summary>
    [MaxLength(50)]
    public string? OperationType { get; set; }

    [MaxLength(200)]
    public string? Operator { get; set; }

    [MaxLength(50)]
    public string? Status { get; set; }

    public bool IsActive { get; set; } = true;

    public bool IsArchived { get; set; } = false;

    public DateTime? ArchivedAt { get; set; }

    public string? ArchivedReason { get; set; }

    [MaxLength(200)]
    public string? ContactEmail { get; set; }

    [MaxLength(100)]
    public string? ContactPhone { get; set; }

    [MaxLength(500)]
    public string? Website { get; set; }

    [MaxLength(100)]
    public string? Timezone { get; set; }

    public string? Description { get; set; }

    public double? CapacityMtpa { get; set; }

    public double? StorageCapacity { get; set; }

    public int? NumberOfTanks { get; set; }

    public double? LoadingRate { get; set; }

    public double? ApproachChannelDepth { get; set; }

    public bool PilotageRequired { get; set; } = false;

    public bool TugsAvailable { get; set; } = false;

    public string? Notes { get; set; }

    public string? ProcedureNotes { get; set; }

    public string? FormsNotes { get; set; }
}
