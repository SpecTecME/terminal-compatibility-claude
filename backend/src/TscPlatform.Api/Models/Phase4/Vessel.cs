using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace TscPlatform.Api.Models.Phase4;

[Table("Vessel")]
public class Vessel : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string? VesselInternalId { get; set; }
    public string? ImoNumber { get; set; }
    public string? Mmsi { get; set; }
    public string? CallSign { get; set; }

    public int? VesselTypeRefId { get; set; }
    public string? VesselTypeRefPublicId { get; set; }

    public int? FlagCountryId { get; set; }
    public string? FlagCountryPublicId { get; set; }

    public int? OwnerCompanyId { get; set; }
    public string? OwnerCompanyPublicId { get; set; }

    public int? OperatorCompanyId { get; set; }
    public string? OperatorCompanyPublicId { get; set; }

    public int? ClassSocietyCompanyId { get; set; }
    public string? ClassSocietyCompanyPublicId { get; set; }

    public string? Udf01 { get; set; }
    public string? Udf02 { get; set; }

    public int? YearBuilt { get; set; }
    public string? Shipyard { get; set; }
    public string? ClassNotation { get; set; }

    // Dimensions — snake_case names preserved via JsonPropertyName
    [JsonPropertyName("loa_m")]
    public double? LoaM { get; set; }

    [JsonPropertyName("width_m")]
    public double? WidthM { get; set; }

    [JsonPropertyName("beam_m")]
    public double? BeamM { get; set; }

    [JsonPropertyName("depth_m")]
    public double? DepthM { get; set; }

    public double? LbpM { get; set; }
    public double? MouldedDepthM { get; set; }
    public double? BreadthMouldedM { get; set; }
    public double? SummerDraftM { get; set; }

    [JsonPropertyName("designDraft_m")]
    public double? DesignDraftM { get; set; }

    [JsonPropertyName("maxDraft_m")]
    public double? MaxDraftM { get; set; }

    [JsonPropertyName("airDraft_m")]
    public double? AirDraftM { get; set; }

    [JsonPropertyName("displacementSummer_t")]
    public double? DisplacementSummerT { get; set; }

    public double? Gt { get; set; }
    public double? NtItc69 { get; set; }
    public double? Dwt { get; set; }

    // Cargo
    public string? CargoContainmentType { get; set; }

    [JsonPropertyName("cargoCapacity_m3")]
    public double? CargoCapacityM3 { get; set; }

    [JsonPropertyName("maxLoadingRate_m3ph")]
    public double? MaxLoadingRateM3Ph { get; set; }

    [JsonPropertyName("maxDischargeRate_m3ph")]
    public double? MaxDischargeRateM3Ph { get; set; }

    public bool VapourReturnSupported { get; set; }
    public string? EsdErcType { get; set; }
    public string? BerthingSideSupported { get; set; }

    // Manifolds
    public int? ManifoldLngCount { get; set; }
    public int? ManifoldVapourCount { get; set; }

    [JsonPropertyName("lngManifoldHeightMin_m")]
    public double? LngManifoldHeightMinM { get; set; }

    [JsonPropertyName("lngManifoldHeightMax_m")]
    public double? LngManifoldHeightMaxM { get; set; }

    [JsonPropertyName("vapourManifoldHeightMin_m")]
    public double? VapourManifoldHeightMinM { get; set; }

    [JsonPropertyName("vapourManifoldHeightMax_m")]
    public double? VapourManifoldHeightMaxM { get; set; }

    [JsonPropertyName("manifoldSpacingPitch_mm")]
    public double? ManifoldSpacingPitchMm { get; set; }

    [JsonPropertyName("manifoldToBow_m")]
    public double? ManifoldToBowM { get; set; }

    [JsonPropertyName("manifoldToStern_m")]
    public double? ManifoldToSternM { get; set; }

    [JsonPropertyName("flangeSizeLng_in")]
    public string? FlangeSizeLngIn { get; set; }

    public string? FlangeRating { get; set; }
    public string? ErcManufacturerModel { get; set; }

    // Mooring
    public int? MooringWinches { get; set; }
    public int? MooringLinesTotal { get; set; }
    public int? HeadLines { get; set; }
    public int? BreastLinesForward { get; set; }
    public int? SpringsForward { get; set; }
    public int? SternLines { get; set; }
    public int? BreastLinesAft { get; set; }
    public int? SpringsAft { get; set; }
    public string? LineType { get; set; }

    [JsonPropertyName("lineMBL_kN")]
    public double? LineMblKn { get; set; }

    [JsonPropertyName("brakeHoldingCapacity_kN")]
    public double? BrakeHoldingCapacityKn { get; set; }

    public string? ChockType { get; set; }
    public string? FairleadChockPositionsNotes { get; set; }

    // Fender & Environmental
    public string? FenderContactZone { get; set; }
    public string? ShellPlatingRestrictions { get; set; }

    [JsonPropertyName("fenderPointLoadLimit_kN")]
    public double? FenderPointLoadLimitKn { get; set; }

    public string? PreferredFenderType { get; set; }

    [JsonPropertyName("maxWindBerthing_kn")]
    public double? MaxWindBerthingKn { get; set; }

    [JsonPropertyName("maxWindAlongside_kn")]
    public double? MaxWindAlongsideKn { get; set; }

    [JsonPropertyName("maxCurrentAlongside_kn")]
    public double? MaxCurrentAlongsideKn { get; set; }

    [JsonPropertyName("maxWaveHeight_m")]
    public double? MaxWaveHeightM { get; set; }

    [JsonPropertyName("tideRangeMin_m")]
    public double? TideRangeMinM { get; set; }

    [JsonPropertyName("tideRangeMax_m")]
    public double? TideRangeMaxM { get; set; }

    public string? TugRequirementsNotes { get; set; }

    public string Status { get; set; } = "Active";
    public bool IsActive { get; set; } = true;

    [JsonPropertyName("image_url")]
    public string? ImageUrl { get; set; }
}
