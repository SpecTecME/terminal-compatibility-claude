/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AddBerth from './pages/AddBerth';
import AddCargoType from './pages/AddCargoType';
import AddCompany from './pages/AddCompany';
import AddContact from './pages/AddContact';
import AddCountry from './pages/AddCountry';
import AddDocumentCategory from './pages/AddDocumentCategory';
import AddDocumentType from './pages/AddDocumentType';
import AddFuelType from './pages/AddFuelType';
import AddIdentityProvider from './pages/AddIdentityProvider';
import AddIssuingAuthority from './pages/AddIssuingAuthority';
import AddProductType from './pages/AddProductType';
import AddSystemTag from './pages/AddSystemTag';
import AddTerminal from './pages/AddTerminal';
import AddTerminalComplex from './pages/AddTerminalComplex';
import AddVessel from './pages/AddVessel';
import AddVesselTerminalDocumentSet from './pages/AddVesselTerminalDocumentSet';
import AddVesselType from './pages/AddVesselType';
import AdminUsers from './pages/AdminUsers';
import AuditLog from './pages/AuditLog';
import AuditLogDetail from './pages/AuditLogDetail';
import BackfillCountries from './pages/BackfillCountries';
import BackfillPublicIds from './pages/BackfillPublicIds';
import BackfillTerminalProductTypes from './pages/BackfillTerminalProductTypes';
import BerthDetail from './pages/BerthDetail';
import Berths from './pages/Berths';
import CargoTypes from './pages/CargoTypes';
import CleanupDuplicateCountries from './pages/CleanupDuplicateCountries';
import CleanupLegacyDocumentTypes from './pages/CleanupLegacyDocumentTypes';
import Companies from './pages/Companies';
import CompanyDetail from './pages/CompanyDetail';
import ComplexRegistration from './pages/ComplexRegistration';
import Configuration from './pages/Configuration';
import ConfigurationAppSettings from './pages/ConfigurationAppSettings';
import ConfigurationMasterData from './pages/ConfigurationMasterData';
import ConfigurationSystemConfig from './pages/ConfigurationSystemConfig';
import ConfigurationVesselConfig from './pages/ConfigurationVesselConfig';
import ContactDetail from './pages/ContactDetail';
import Contacts from './pages/Contacts';
import Countries from './pages/Countries';
import CountryAliases from './pages/CountryAliases';
import CountryDetail from './pages/CountryDetail';
import Dashboard from './pages/Dashboard';
import DeduplicateDocumentTypes from './pages/DeduplicateDocumentTypes';
import DesignElements from './pages/DesignElements';
import DocumentCategories from './pages/DocumentCategories';
import DocumentCategoryDetail from './pages/DocumentCategoryDetail';
import DocumentDetail from './pages/DocumentDetail';
import DocumentTypeDetail from './pages/DocumentTypeDetail';
import DocumentTypes from './pages/DocumentTypes';
import Documents from './pages/Documents';
import EditBerth from './pages/EditBerth';
import EditCargoType from './pages/EditCargoType';
import EditCompany from './pages/EditCompany';
import EditContact from './pages/EditContact';
import EditCountry from './pages/EditCountry';
import EditDocumentCategory from './pages/EditDocumentCategory';
import EditDocumentType from './pages/EditDocumentType';
import EditFuelType from './pages/EditFuelType';
import EditIdentityProvider from './pages/EditIdentityProvider';
import EditIssuingAuthority from './pages/EditIssuingAuthority';
import EditProductType from './pages/EditProductType';
import EditSystemTag from './pages/EditSystemTag';
import EditTerminal from './pages/EditTerminal';
import EditTerminalComplex from './pages/EditTerminalComplex';
import EditUdfConfiguration from './pages/EditUdfConfiguration';
import EditVessel from './pages/EditVessel';
import EditVesselTerminalDocumentSet from './pages/EditVesselTerminalDocumentSet';
import EditVesselType from './pages/EditVesselType';
import FixTerminalCountryIds from './pages/FixTerminalCountryIds';
import FuelTypes from './pages/FuelTypes';
import GroupRoleMappings from './pages/GroupRoleMappings';
import Home from './pages/Home';
import IdentityProviders from './pages/IdentityProviders';
import IssuingAuthorities from './pages/IssuingAuthorities';
import MigrateBerthData from './pages/MigrateBerthData';
import MigrateBerthProducts from './pages/MigrateBerthProducts';
import MigrateCargoToProductMapping from './pages/MigrateCargoToProductMapping';
import MigrateDocumentCategories from './pages/MigrateDocumentCategories';
import MigrateLegacyDocumentTypeFields from './pages/MigrateLegacyDocumentTypeFields';
import MigrateSiteToTerminalComplex from './pages/MigrateSiteToTerminalComplex';
import MigrateTerminalCountries from './pages/MigrateTerminalCountries';
import MigrateVesselRelationships from './pages/MigrateVesselRelationships';
import MyTags from './pages/MyTags';
import Preferences from './pages/Preferences';
import ProductTypes from './pages/ProductTypes';
import Profile from './pages/Profile';
import Registration from './pages/Registration';
import RegistrationApplications from './pages/RegistrationApplications';
import RegistrationEntrypoint from './pages/RegistrationEntrypoint';
import Roles from './pages/Roles';
import SecurityPolicies from './pages/SecurityPolicies';
import SeedAdditionalDocumentTypes from './pages/SeedAdditionalDocumentTypes';
import SeedBerthDemoData from './pages/SeedBerthDemoData';
import SeedCargoTypes from './pages/SeedCargoTypes';
import SeedContactTags from './pages/SeedContactTags';
import SeedCountries from './pages/SeedCountries';
import SeedCountriesWorld from './pages/SeedCountriesWorld';
import SeedCountryAliases from './pages/SeedCountryAliases';
import SeedDocumentCategories from './pages/SeedDocumentCategories';
import SeedDocumentTypeAliases from './pages/SeedDocumentTypeAliases';
import SeedDocumentTypeExternalCodesDNV from './pages/SeedDocumentTypeExternalCodesDNV';
import SeedDocumentTypes from './pages/SeedDocumentTypes';
import SeedFuelTypes from './pages/SeedFuelTypes';
import SeedHelpContent from './pages/SeedHelpContent';
import SeedIACSCompanies from './pages/SeedIACSCompanies';
import SeedMaritimeZones from './pages/SeedMaritimeZones';
import SeedNakilatPartners from './pages/SeedNakilatPartners';
import SeedProductTypes from './pages/SeedProductTypes';
import SeedProductTypesGBM from './pages/SeedProductTypesGBM';
import SeedRasLaffan from './pages/SeedRasLaffan';
import SeedSSODemoData from './pages/SeedSSODemoData';
import SeedSimpleDocumentSets from './pages/SeedSimpleDocumentSets';
import SeedSystemTags from './pages/SeedSystemTags';
import SeedTerminalRequirementsDemo from './pages/SeedTerminalRequirementsDemo';
import SeedUdfConfigurations from './pages/SeedUdfConfigurations';
import SeedVesselTypeAllowedCargoTypes from './pages/SeedVesselTypeAllowedCargoTypes';
import SeedVesselTypeAllowedFuelTypes from './pages/SeedVesselTypeAllowedFuelTypes';
import SeedVesselTypeCargoPolicy from './pages/SeedVesselTypeCargoPolicy';
import SeedVesselTypeFSRUFSU from './pages/SeedVesselTypeFSRUFSU';
import SeedVesselTypeFuelTankPolicy from './pages/SeedVesselTypeFuelTankPolicy';
import SeedVesselZones from './pages/SeedVesselZones';
import Settings from './pages/Settings';
import SimpleRegistration from './pages/SimpleRegistration';
import SubmitApproval from './pages/SubmitApproval';
import SystemTagDetail from './pages/SystemTagDetail';
import SystemTags from './pages/SystemTags';
import TagAuthorityCompanies from './pages/TagAuthorityCompanies';
import TerminalComplexDetail from './pages/TerminalComplexDetail';
import TerminalComplexes from './pages/TerminalComplexes';
import TerminalDetail from './pages/TerminalDetail';
import TerminalMap from './pages/TerminalMap';
import TerminalRequirements from './pages/TerminalRequirements';
import Terminals from './pages/Terminals';
import TerminalsMissingCountry from './pages/TerminalsMissingCountry';
import UdfConfigurations from './pages/UdfConfigurations';
import UpdateBerthProductServices from './pages/UpdateBerthProductServices';
import UpdateTerminalCountries from './pages/UpdateTerminalCountries';
import UpdateTerminalProductTypes from './pages/UpdateTerminalProductTypes';
import UploadDocument from './pages/UploadDocument';
import UserSecurity from './pages/UserSecurity';
import VesselDetail from './pages/VesselDetail';
import VesselTerminalDocumentSets from './pages/VesselTerminalDocumentSets';
import VesselTypeAllowedCargoTypes from './pages/VesselTypeAllowedCargoTypes';
import VesselTypeAllowedFuelTypes from './pages/VesselTypeAllowedFuelTypes';
import VesselTypeCargoPolicy from './pages/VesselTypeCargoPolicy';
import VesselTypeFuelTankPolicy from './pages/VesselTypeFuelTankPolicy';
import VesselTypes from './pages/VesselTypes';
import Vessels from './pages/Vessels';
import Workflow from './pages/Workflow';
import CleanupDuplicateClassSocietyCompanies from './pages/CleanupDuplicateClassSocietyCompanies';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AddBerth": AddBerth,
    "AddCargoType": AddCargoType,
    "AddCompany": AddCompany,
    "AddContact": AddContact,
    "AddCountry": AddCountry,
    "AddDocumentCategory": AddDocumentCategory,
    "AddDocumentType": AddDocumentType,
    "AddFuelType": AddFuelType,
    "AddIdentityProvider": AddIdentityProvider,
    "AddIssuingAuthority": AddIssuingAuthority,
    "AddProductType": AddProductType,
    "AddSystemTag": AddSystemTag,
    "AddTerminal": AddTerminal,
    "AddTerminalComplex": AddTerminalComplex,
    "AddVessel": AddVessel,
    "AddVesselTerminalDocumentSet": AddVesselTerminalDocumentSet,
    "AddVesselType": AddVesselType,
    "AdminUsers": AdminUsers,
    "AuditLog": AuditLog,
    "AuditLogDetail": AuditLogDetail,
    "BackfillCountries": BackfillCountries,
    "BackfillPublicIds": BackfillPublicIds,
    "BackfillTerminalProductTypes": BackfillTerminalProductTypes,
    "BerthDetail": BerthDetail,
    "Berths": Berths,
    "CargoTypes": CargoTypes,
    "CleanupDuplicateCountries": CleanupDuplicateCountries,
    "CleanupLegacyDocumentTypes": CleanupLegacyDocumentTypes,
    "Companies": Companies,
    "CompanyDetail": CompanyDetail,
    "ComplexRegistration": ComplexRegistration,
    "Configuration": Configuration,
    "ConfigurationAppSettings": ConfigurationAppSettings,
    "ConfigurationMasterData": ConfigurationMasterData,
    "ConfigurationSystemConfig": ConfigurationSystemConfig,
    "ConfigurationVesselConfig": ConfigurationVesselConfig,
    "ContactDetail": ContactDetail,
    "Contacts": Contacts,
    "Countries": Countries,
    "CountryAliases": CountryAliases,
    "CountryDetail": CountryDetail,
    "Dashboard": Dashboard,
    "DeduplicateDocumentTypes": DeduplicateDocumentTypes,
    "DesignElements": DesignElements,
    "DocumentCategories": DocumentCategories,
    "DocumentCategoryDetail": DocumentCategoryDetail,
    "DocumentDetail": DocumentDetail,
    "DocumentTypeDetail": DocumentTypeDetail,
    "DocumentTypes": DocumentTypes,
    "Documents": Documents,
    "EditBerth": EditBerth,
    "EditCargoType": EditCargoType,
    "EditCompany": EditCompany,
    "EditContact": EditContact,
    "EditCountry": EditCountry,
    "EditDocumentCategory": EditDocumentCategory,
    "EditDocumentType": EditDocumentType,
    "EditFuelType": EditFuelType,
    "EditIdentityProvider": EditIdentityProvider,
    "EditIssuingAuthority": EditIssuingAuthority,
    "EditProductType": EditProductType,
    "EditSystemTag": EditSystemTag,
    "EditTerminal": EditTerminal,
    "EditTerminalComplex": EditTerminalComplex,
    "EditUdfConfiguration": EditUdfConfiguration,
    "EditVessel": EditVessel,
    "EditVesselTerminalDocumentSet": EditVesselTerminalDocumentSet,
    "EditVesselType": EditVesselType,
    "FixTerminalCountryIds": FixTerminalCountryIds,
    "FuelTypes": FuelTypes,
    "GroupRoleMappings": GroupRoleMappings,
    "Home": Home,
    "IdentityProviders": IdentityProviders,
    "IssuingAuthorities": IssuingAuthorities,
    "MigrateBerthData": MigrateBerthData,
    "MigrateBerthProducts": MigrateBerthProducts,
    "MigrateCargoToProductMapping": MigrateCargoToProductMapping,
    "MigrateDocumentCategories": MigrateDocumentCategories,
    "MigrateLegacyDocumentTypeFields": MigrateLegacyDocumentTypeFields,
    "MigrateSiteToTerminalComplex": MigrateSiteToTerminalComplex,
    "MigrateTerminalCountries": MigrateTerminalCountries,
    "MigrateVesselRelationships": MigrateVesselRelationships,
    "MyTags": MyTags,
    "Preferences": Preferences,
    "ProductTypes": ProductTypes,
    "Profile": Profile,
    "Registration": Registration,
    "RegistrationApplications": RegistrationApplications,
    "RegistrationEntrypoint": RegistrationEntrypoint,
    "Roles": Roles,
    "SecurityPolicies": SecurityPolicies,
    "SeedAdditionalDocumentTypes": SeedAdditionalDocumentTypes,
    "SeedBerthDemoData": SeedBerthDemoData,
    "SeedCargoTypes": SeedCargoTypes,
    "SeedContactTags": SeedContactTags,
    "SeedCountries": SeedCountries,
    "SeedCountriesWorld": SeedCountriesWorld,
    "SeedCountryAliases": SeedCountryAliases,
    "SeedDocumentCategories": SeedDocumentCategories,
    "SeedDocumentTypeAliases": SeedDocumentTypeAliases,
    "SeedDocumentTypeExternalCodesDNV": SeedDocumentTypeExternalCodesDNV,
    "SeedDocumentTypes": SeedDocumentTypes,
    "SeedFuelTypes": SeedFuelTypes,
    "SeedHelpContent": SeedHelpContent,
    "SeedIACSCompanies": SeedIACSCompanies,
    "SeedMaritimeZones": SeedMaritimeZones,
    "SeedNakilatPartners": SeedNakilatPartners,
    "SeedProductTypes": SeedProductTypes,
    "SeedProductTypesGBM": SeedProductTypesGBM,
    "SeedRasLaffan": SeedRasLaffan,
    "SeedSSODemoData": SeedSSODemoData,
    "SeedSimpleDocumentSets": SeedSimpleDocumentSets,
    "SeedSystemTags": SeedSystemTags,
    "SeedTerminalRequirementsDemo": SeedTerminalRequirementsDemo,
    "SeedUdfConfigurations": SeedUdfConfigurations,
    "SeedVesselTypeAllowedCargoTypes": SeedVesselTypeAllowedCargoTypes,
    "SeedVesselTypeAllowedFuelTypes": SeedVesselTypeAllowedFuelTypes,
    "SeedVesselTypeCargoPolicy": SeedVesselTypeCargoPolicy,
    "SeedVesselTypeFSRUFSU": SeedVesselTypeFSRUFSU,
    "SeedVesselTypeFuelTankPolicy": SeedVesselTypeFuelTankPolicy,
    "SeedVesselZones": SeedVesselZones,
    "Settings": Settings,
    "SimpleRegistration": SimpleRegistration,
    "SubmitApproval": SubmitApproval,
    "SystemTagDetail": SystemTagDetail,
    "SystemTags": SystemTags,
    "TagAuthorityCompanies": TagAuthorityCompanies,
    "TerminalComplexDetail": TerminalComplexDetail,
    "TerminalComplexes": TerminalComplexes,
    "TerminalDetail": TerminalDetail,
    "TerminalMap": TerminalMap,
    "TerminalRequirements": TerminalRequirements,
    "Terminals": Terminals,
    "TerminalsMissingCountry": TerminalsMissingCountry,
    "UdfConfigurations": UdfConfigurations,
    "UpdateBerthProductServices": UpdateBerthProductServices,
    "UpdateTerminalCountries": UpdateTerminalCountries,
    "UpdateTerminalProductTypes": UpdateTerminalProductTypes,
    "UploadDocument": UploadDocument,
    "UserSecurity": UserSecurity,
    "VesselDetail": VesselDetail,
    "VesselTerminalDocumentSets": VesselTerminalDocumentSets,
    "VesselTypeAllowedCargoTypes": VesselTypeAllowedCargoTypes,
    "VesselTypeAllowedFuelTypes": VesselTypeAllowedFuelTypes,
    "VesselTypeCargoPolicy": VesselTypeCargoPolicy,
    "VesselTypeFuelTankPolicy": VesselTypeFuelTankPolicy,
    "VesselTypes": VesselTypes,
    "Vessels": Vessels,
    "Workflow": Workflow,
    "CleanupDuplicateClassSocietyCompanies": CleanupDuplicateClassSocietyCompanies,
}

export const pagesConfig = {
    mainPage: "TerminalMap",
    Pages: PAGES,
    Layout: __Layout,
};