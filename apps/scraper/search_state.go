package main

// DefaultSearchState creates the default search state with the given query.
func DefaultSearchState(query string) SearchState {
	return SearchState{
		Locations: []Location{{
			FormattedAddress: "United States",
			Types:            []string{"country"},
			Geometry: Geometry{
				Location: GeoPoint{Lat: "39.8283", Lon: "-98.5795"},
			},
			ID: "user_country",
			AddressComponents: []AddressComponent{{
				LongName:  "United States",
				ShortName: "US",
				Types:     []string{"country"},
			}},
			Options: LocationOptions{
				FlexibleRegions: []string{"anywhere_in_continent", "anywhere_in_world"},
			},
		}},
		WorkplaceTypes:                      []string{"Remote", "Hybrid", "Onsite"},
		DefaultToUserLocation:               false,
		PhysicalEnvironments:                []string{"Office", "Outdoor", "Vehicle", "Industrial", "Customer-Facing"},
		PhysicalLaborIntensity:              []string{"Low", "Medium", "High"},
		PhysicalPositions:                   []string{"Sitting", "Standing"},
		OralCommunicationLevels:             []string{"Low", "Medium", "High"},
		ComputerUsageLevels:                 []string{"Low", "Medium", "High"},
		CognitiveDemandLevels:               []string{"Low", "Medium", "High"},
		Currency:                            LabelValue{Label: "Any"},
		Frequency:                           LabelValue{Label: "Any"},
		RestrictJobsToTransparentSalaries:   false,
		CalcFrequency:                       "Yearly",
		CommitmentTypes:                     []string{"Full Time", "Part Time", "Contract", "Internship", "Temporary", "Seasonal", "Volunteer"},
		SeniorityLevel:                      []string{"No Prior Experience Required", "Entry Level", "Mid Level"},
		RoleTypes:                           []string{"Individual Contributor", "People Manager"},
		RoleYoeRange:                        [2]int{0, 20},
		ManagementYoeRange:                  [2]int{0, 20},
		SecurityClearances:                  []string{"None", "Confidential", "Secret", "Top Secret", "Top Secret/SCI", "Public Trust", "Interim Clearances", "Other"},
		LanguageRequirementsOperator:        "OR",
		AirTravelRequirement:               []string{"None", "Minimal", "Moderate", "Extensive"},
		LandTravelRequirement:              []string{"None", "Minimal", "Moderate", "Extensive"},
		WeekendAvailabilityRequired:         "Doesn't Matter",
		HolidayAvailabilityRequired:         "Doesn't Matter",
		OvertimeRequired:                    "Doesn't Matter",
		OnCallRequirements:                  []string{"None", "Occasional (once a month or less)", "Regular (once a week or more)"},
		CompanyKeywordsBooleanOperator:      "OR",
		SearchQuery:                         query,
		DateFetchedPastNDays:                61,
		SortBy:                              "default",
		CompanyPublicOrPrivate:              "all",
		LatestInvestmentYearRange:           [2]any{nil, nil},
		IsNonProfit:                         "all",
		// Empty slices
		AssociatesDegreeFieldsOfStudy:         []any{},
		ExcludedAssociatesDegreeFieldsOfStudy: []any{},
		BachelorsDegreeFieldsOfStudy:          []any{},
		ExcludedBachelorsDegreeFieldsOfStudy:  []any{},
		MastersDegreeFieldsOfStudy:            []any{},
		ExcludedMastersDegreeFieldsOfStudy:    []any{},
		DoctorateDegreeFieldsOfStudy:          []any{},
		ExcludedDoctorateDegreeFieldsOfStudy:  []any{},
		AssociatesDegreeRequirements:          []any{},
		BachelorsDegreeRequirements:           []any{},
		MastersDegreeRequirements:             []any{},
		DoctorateDegreeRequirements:           []any{},
		LicensesAndCertifications:             []any{},
		ExcludedLicensesAndCertifications:     []any{},
		LanguageRequirements:                  []any{},
		ExcludedLanguageRequirements:          []any{},
		MorningShiftWork:                      []any{},
		EveningShiftWork:                      []any{},
		OvernightShiftWork:                    []any{},
		BenefitsAndPerks:                      []any{},
		ApplicationFormEase:                   []any{},
		CompanyNames:                          []any{},
		ExcludedCompanyNames:                  []any{},
		Industries:                            []any{},
		ExcludedIndustries:                    []any{},
		CompanyKeywords:                       []any{},
		ExcludedCompanyKeywords:               []any{},
		HideJobTypes:                          []any{},
		EncouragedToApply:                     []any{},
		HiddenCompanies:                       []any{},
		Departments:                           []any{},
		RestrictedSearchAttributes:            []any{},
		LatestInvestmentSeries:                []any{},
		LatestInvestmentCurrency:              []any{},
		Investors:                             []any{},
		ExcludedInvestors:                     []any{},
		CompanySizeRanges:                     []any{},
		ExcludedLatestInvestmentSeries:        []any{},
	}
}

// BuildSearchState creates a SearchState from a SearchRequest, applying overrides.
func BuildSearchState(req SearchRequest) SearchState {
	state := DefaultSearchState(req.Query)

	if len(req.WorkplaceTypes) > 0 {
		state.WorkplaceTypes = req.WorkplaceTypes
	}
	if len(req.CommitmentTypes) > 0 {
		state.CommitmentTypes = req.CommitmentTypes
	}
	if len(req.SeniorityLevels) > 0 {
		state.SeniorityLevel = req.SeniorityLevels
	}
	if req.DatePastDays > 0 {
		state.DateFetchedPastNDays = req.DatePastDays
	}
	if req.Location != "" {
		country := req.LocationCountry
		if country == "" {
			country = "US"
		}
		state.Locations = []Location{{
			FormattedAddress: req.Location,
			Types:            []string{"country"},
			Geometry: Geometry{
				Location: GeoPoint{Lat: "39.8283", Lon: "-98.5795"},
			},
			ID: "user_country",
			AddressComponents: []AddressComponent{{
				LongName:  req.Location,
				ShortName: country,
				Types:     []string{"country"},
			}},
			Options: LocationOptions{
				FlexibleRegions: []string{"anywhere_in_continent", "anywhere_in_world"},
			},
		}}
	}

	return state
}
