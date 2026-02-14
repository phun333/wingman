package main

// SearchState represents the full search filter configuration for hiring.cafe API.
type SearchState struct {
	Locations                                []Location  `json:"locations"`
	WorkplaceTypes                           []string    `json:"workplaceTypes"`
	DefaultToUserLocation                    bool        `json:"defaultToUserLocation"`
	UserLocation                             any         `json:"userLocation"`
	PhysicalEnvironments                     []string    `json:"physicalEnvironments"`
	PhysicalLaborIntensity                   []string    `json:"physicalLaborIntensity"`
	PhysicalPositions                        []string    `json:"physicalPositions"`
	OralCommunicationLevels                  []string    `json:"oralCommunicationLevels"`
	ComputerUsageLevels                      []string    `json:"computerUsageLevels"`
	CognitiveDemandLevels                    []string    `json:"cognitiveDemandLevels"`
	Currency                                 LabelValue  `json:"currency"`
	Frequency                                LabelValue  `json:"frequency"`
	MinCompensationLowEnd                    any         `json:"minCompensationLowEnd"`
	MinCompensationHighEnd                   any         `json:"minCompensationHighEnd"`
	MaxCompensationLowEnd                    any         `json:"maxCompensationLowEnd"`
	MaxCompensationHighEnd                   any         `json:"maxCompensationHighEnd"`
	RestrictJobsToTransparentSalaries        bool        `json:"restrictJobsToTransparentSalaries"`
	CalcFrequency                            string      `json:"calcFrequency"`
	CommitmentTypes                          []string    `json:"commitmentTypes"`
	JobTitleQuery                            string      `json:"jobTitleQuery"`
	JobDescriptionQuery                      string      `json:"jobDescriptionQuery"`
	AssociatesDegreeFieldsOfStudy            []any       `json:"associatesDegreeFieldsOfStudy"`
	ExcludedAssociatesDegreeFieldsOfStudy    []any       `json:"excludedAssociatesDegreeFieldsOfStudy"`
	BachelorsDegreeFieldsOfStudy             []any       `json:"bachelorsDegreeFieldsOfStudy"`
	ExcludedBachelorsDegreeFieldsOfStudy     []any       `json:"excludedBachelorsDegreeFieldsOfStudy"`
	MastersDegreeFieldsOfStudy               []any       `json:"mastersDegreeFieldsOfStudy"`
	ExcludedMastersDegreeFieldsOfStudy       []any       `json:"excludedMastersDegreeFieldsOfStudy"`
	DoctorateDegreeFieldsOfStudy             []any       `json:"doctorateDegreeFieldsOfStudy"`
	ExcludedDoctorateDegreeFieldsOfStudy     []any       `json:"excludedDoctorateDegreeFieldsOfStudy"`
	AssociatesDegreeRequirements             []any       `json:"associatesDegreeRequirements"`
	BachelorsDegreeRequirements              []any       `json:"bachelorsDegreeRequirements"`
	MastersDegreeRequirements                []any       `json:"mastersDegreeRequirements"`
	DoctorateDegreeRequirements              []any       `json:"doctorateDegreeRequirements"`
	LicensesAndCertifications                []any       `json:"licensesAndCertifications"`
	ExcludedLicensesAndCertifications        []any       `json:"excludedLicensesAndCertifications"`
	ExcludeAllLicensesAndCertifications      bool        `json:"excludeAllLicensesAndCertifications"`
	SeniorityLevel                           []string    `json:"seniorityLevel"`
	RoleTypes                                []string    `json:"roleTypes"`
	RoleYoeRange                             [2]int      `json:"roleYoeRange"`
	ExcludeIfRoleYoeIsNotSpecified           bool        `json:"excludeIfRoleYoeIsNotSpecified"`
	ManagementYoeRange                       [2]int      `json:"managementYoeRange"`
	ExcludeIfManagementYoeIsNotSpecified     bool        `json:"excludeIfManagementYoeIsNotSpecified"`
	SecurityClearances                       []string    `json:"securityClearances"`
	LanguageRequirements                     []any       `json:"languageRequirements"`
	ExcludedLanguageRequirements             []any       `json:"excludedLanguageRequirements"`
	LanguageRequirementsOperator             string      `json:"languageRequirementsOperator"`
	ExcludeJobsWithAdditionalLangReq         bool        `json:"excludeJobsWithAdditionalLanguageRequirements"`
	AirTravelRequirement                     []string    `json:"airTravelRequirement"`
	LandTravelRequirement                    []string    `json:"landTravelRequirement"`
	MorningShiftWork                         []any       `json:"morningShiftWork"`
	EveningShiftWork                         []any       `json:"eveningShiftWork"`
	OvernightShiftWork                       []any       `json:"overnightShiftWork"`
	WeekendAvailabilityRequired              string      `json:"weekendAvailabilityRequired"`
	HolidayAvailabilityRequired              string      `json:"holidayAvailabilityRequired"`
	OvertimeRequired                         string      `json:"overtimeRequired"`
	OnCallRequirements                       []string    `json:"onCallRequirements"`
	BenefitsAndPerks                         []any       `json:"benefitsAndPerks"`
	ApplicationFormEase                      []any       `json:"applicationFormEase"`
	CompanyNames                             []any       `json:"companyNames"`
	ExcludedCompanyNames                     []any       `json:"excludedCompanyNames"`
	USAGovPref                               any         `json:"usaGovPref"`
	Industries                               []any       `json:"industries"`
	ExcludedIndustries                       []any       `json:"excludedIndustries"`
	CompanyKeywords                          []any       `json:"companyKeywords"`
	CompanyKeywordsBooleanOperator           string      `json:"companyKeywordsBooleanOperator"`
	ExcludedCompanyKeywords                  []any       `json:"excludedCompanyKeywords"`
	HideJobTypes                             []any       `json:"hideJobTypes"`
	EncouragedToApply                        []any       `json:"encouragedToApply"`
	SearchQuery                              string      `json:"searchQuery"`
	DateFetchedPastNDays                     int         `json:"dateFetchedPastNDays"`
	HiddenCompanies                          []any       `json:"hiddenCompanies"`
	User                                     any         `json:"user"`
	SearchModeSelectedCompany                any         `json:"searchModeSelectedCompany"`
	Departments                              []any       `json:"departments"`
	RestrictedSearchAttributes               []any       `json:"restrictedSearchAttributes"`
	SortBy                                   string      `json:"sortBy"`
	TechnologyKeywordsQuery                  string      `json:"technologyKeywordsQuery"`
	RequirementsKeywordsQuery                string      `json:"requirementsKeywordsQuery"`
	CompanyPublicOrPrivate                   string      `json:"companyPublicOrPrivate"`
	LatestInvestmentYearRange                [2]any      `json:"latestInvestmentYearRange"`
	LatestInvestmentSeries                   []any       `json:"latestInvestmentSeries"`
	LatestInvestmentAmount                   any         `json:"latestInvestmentAmount"`
	LatestInvestmentCurrency                 []any       `json:"latestInvestmentCurrency"`
	Investors                                []any       `json:"investors"`
	ExcludedInvestors                        []any       `json:"excludedInvestors"`
	IsNonProfit                              string      `json:"isNonProfit"`
	CompanySizeRanges                        []any       `json:"companySizeRanges"`
	MinYearFounded                           any         `json:"minYearFounded"`
	MaxYearFounded                           any         `json:"maxYearFounded"`
	ExcludedLatestInvestmentSeries           []any       `json:"excludedLatestInvestmentSeries"`
}

// Location represents a geographic location filter.
type Location struct {
	FormattedAddress  string             `json:"formatted_address"`
	Types             []string           `json:"types"`
	Geometry          Geometry           `json:"geometry"`
	ID                string             `json:"id"`
	AddressComponents []AddressComponent `json:"address_components"`
	Options           LocationOptions    `json:"options"`
}

// Geometry holds lat/lon info.
type Geometry struct {
	Location GeoPoint `json:"location"`
}

// GeoPoint represents a lat/lon pair (as strings to match the API).
type GeoPoint struct {
	Lat string `json:"lat"`
	Lon string `json:"lon"`
}

// AddressComponent is a structured address part.
type AddressComponent struct {
	LongName  string   `json:"long_name"`
	ShortName string   `json:"short_name"`
	Types     []string `json:"types"`
}

// LocationOptions holds flexible region configuration.
type LocationOptions struct {
	FlexibleRegions []string `json:"flexible_regions"`
}

// LabelValue is a generic label+value pair used for currency/frequency selectors.
type LabelValue struct {
	Label string `json:"label"`
	Value any    `json:"value"`
}

// CountRequest is the payload for the total count endpoint.
type CountRequest struct {
	SearchState SearchState `json:"searchState"`
}

// CountResponse is the response from the total count endpoint.
type CountResponse struct {
	Total int `json:"total"`
}

// JobsRequest is the payload for the search jobs endpoint.
type JobsRequest struct {
	Size        int         `json:"size"`
	Page        int         `json:"page"`
	SearchState SearchState `json:"searchState"`
}

// Job represents a single job listing returned by the API.
// We keep it flexible with map since the schema may vary.
type Job = map[string]any

// JobsResponse wraps possible response shapes from the API.
type JobsResponse struct {
	Results []Job `json:"results,omitempty"`
	Jobs    []Job `json:"jobs,omitempty"`
	Data    []Job `json:"data,omitempty"`
	Items   []Job `json:"items,omitempty"`
	Content []Job `json:"content,omitempty"`
	Hits    *Hits `json:"hits,omitempty"`
}

// Hits represents an Elasticsearch-style response.
type Hits struct {
	Hits []HitItem `json:"hits,omitempty"`
}

// HitItem is a single Elasticsearch hit.
type HitItem struct {
	Source Job `json:"_source,omitempty"`
}

// ScrapeResult is what we return from a scrape operation.
type ScrapeResult struct {
	Query    string `json:"query"`
	Total    int    `json:"total"`
	Scraped  int    `json:"scraped"`
	Jobs     []Job  `json:"jobs"`
}

// --- API server models ---

// SearchRequest is the input for our API server's /search endpoint.
type SearchRequest struct {
	Query            string   `json:"query"`
	Location         string   `json:"location,omitempty"`
	LocationCountry  string   `json:"location_country,omitempty"`
	WorkplaceTypes   []string `json:"workplace_types,omitempty"`
	CommitmentTypes  []string `json:"commitment_types,omitempty"`
	SeniorityLevels  []string `json:"seniority_levels,omitempty"`
	MaxPages         int      `json:"max_pages,omitempty"`
	PageSize         int      `json:"page_size,omitempty"`
	DatePastDays     int      `json:"date_past_days,omitempty"`
}

// ErrorResponse is a standard error envelope.
type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message,omitempty"`
}
