using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TscPlatform.Api.Models.Phase2;

[Table("CompanySystemTagAssignment")]
public class CompanySystemTagAssignment : BaseEntity
{
    public int CompanyId { get; set; }

    [MaxLength(36)]
    public string? CompanyPublicId { get; set; }

    public int SystemTagId { get; set; }

    [MaxLength(36)]
    public string? SystemTagPublicId { get; set; }
}
