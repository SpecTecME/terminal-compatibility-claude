using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TscPlatform.Api.Models.Phase2;

/// <summary>SystemTagAssignment links a Contact to a SystemTag.</summary>
[Table("SystemTagAssignment")]
public class SystemTagAssignment : BaseEntity
{
    public int ContactId { get; set; }

    [MaxLength(36)]
    public string? ContactPublicId { get; set; }

    public int SystemTagId { get; set; }

    [MaxLength(36)]
    public string? SystemTagPublicId { get; set; }
}
