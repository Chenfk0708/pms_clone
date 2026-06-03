import areaDataSource from '@province-city-china/area/area.json?raw'
import cityDataSource from '@province-city-china/city/city.json?raw'
import provinceDataSource from '@province-city-china/province/province.json?raw'

export type RegionOption = {
  code: string
  name: string
}

export type RegionSelection = {
  provinceCode: string
  provinceName: string
  cityCode: string
  cityName: string
  districtCode: string
  districtName: string
}

type RegionProvince = RegionOption & {
  cities: Array<
    RegionOption & {
      districts: RegionOption[]
    }
  >
}

type RegionPanelState = {
  provinces: RegionProvince[]
  activeProvince: RegionProvince | null
  activeCity: (RegionProvince['cities'][number] & { districts: RegionOption[] }) | null
  activeDistrict: RegionOption | null
}

type ProvinceRecord = {
  code: string
  name: string
  province: string
}

type CityRecord = ProvinceRecord & {
  city: string
}

type AreaRecord = CityRecord & {
  area: string
}

const MUNICIPAL_DISTRICT_PLACEHOLDER = '市辖区'
const SINGLE_CITY_PROVINCE_CODES = new Set(['110000', '120000', '310000', '500000', '810000', '820000'])

const provinceRecords = parseRegionDataSource(provinceDataSource, isProvinceRecord, 'province')
const cityRecords = parseRegionDataSource(cityDataSource, isCityRecord, 'city')
const areaRecords = parseRegionDataSource(areaDataSource, isAreaRecord, 'area')

function parseRegionDataSource<T>(source: string, isRecord: (item: unknown) => item is T, label: string): T[] {
  const parsed = JSON.parse(source) as unknown
  if (!Array.isArray(parsed)) {
    throw new Error(`Invalid China ${label} data: expected an array`)
  }

  return parsed.map((item) => {
    if (!isRecord(item)) {
      throw new Error(`Invalid China ${label} data: malformed record`)
    }
    return item
  })
}

function isObjectRecord(item: unknown): item is Record<string, unknown> {
  if (!item || typeof item !== 'object') {
    return false
  }

  return true
}

function isProvinceRecord(item: unknown): item is ProvinceRecord {
  if (!isObjectRecord(item)) {
    return false
  }

  return typeof item.code === 'string' && typeof item.name === 'string' && typeof item.province === 'string'
}

function isCityRecord(item: unknown): item is CityRecord {
  if (!isObjectRecord(item)) {
    return false
  }

  return typeof item.code === 'string' && typeof item.name === 'string' && typeof item.province === 'string' && typeof item.city === 'string'
}

function isAreaRecord(item: unknown): item is AreaRecord {
  if (!isObjectRecord(item)) {
    return false
  }

  return (
    typeof item.code === 'string' &&
    typeof item.name === 'string' &&
    typeof item.province === 'string' &&
    typeof item.city === 'string' &&
    typeof item.area === 'string'
  )
}

function getProvinceCode(record: Pick<ProvinceRecord, 'province'>): string {
  return `${record.province}0000`
}

function getCityCode(record: Pick<CityRecord, 'province' | 'city'>): string {
  return `${record.province}${record.city}00`
}

function toOption(record: Pick<ProvinceRecord, 'code' | 'name'>): RegionOption {
  return { code: record.code, name: record.name }
}

function groupRecordsBy<T>(records: T[], getKey: (record: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>()
  for (const record of records) {
    const key = getKey(record)
    groups.set(key, [...(groups.get(key) ?? []), record])
  }
  return groups
}

function buildRegionTree(): RegionProvince[] {
  const cityRecordsByProvinceCode = groupRecordsBy(cityRecords, getProvinceCode)
  const districtRecords = areaRecords.filter((record) => record.name !== MUNICIPAL_DISTRICT_PLACEHOLDER)
  const districtRecordsByCityCode = groupRecordsBy(districtRecords, (record) =>
    SINGLE_CITY_PROVINCE_CODES.has(getProvinceCode(record)) ? getProvinceCode(record) : getCityCode(record),
  )

  return provinceRecords.map((provinceRecord) => {
    const province = toOption(provinceRecord)
    const cityRecords = cityRecordsByProvinceCode.get(province.code) ?? []

    if (SINGLE_CITY_PROVINCE_CODES.has(province.code)) {
      return {
        ...province,
        cities: [
          {
            code: province.code,
            name: province.name,
            districts: (districtRecordsByCityCode.get(province.code) ?? []).map(toOption),
          },
        ],
      }
    }

    return {
      ...province,
      cities: cityRecords.map((cityRecord) => ({
        ...toOption(cityRecord),
        districts: (districtRecordsByCityCode.get(cityRecord.code) ?? []).map(toOption),
      })),
    }
  })
}

const regionTree = buildRegionTree()
const regionProvinceMap = new Map(regionTree.map((province) => [province.code, province]))

export function getRegionPanelState(selection: Partial<RegionSelection>): RegionPanelState {
  const activeProvince = selection.provinceCode ? regionProvinceMap.get(selection.provinceCode) ?? null : regionTree[0] ?? null
  const activeCity = activeProvince
    ? activeProvince.cities.find((city) => city.code === selection.cityCode) ?? activeProvince.cities[0] ?? null
    : null
  const activeDistrict = activeCity
    ? activeCity.districts.find((district) => district.code === selection.districtCode) ?? activeCity.districts[0] ?? null
    : null

  return {
    provinces: regionTree,
    activeProvince,
    activeCity,
    activeDistrict,
  }
}

export function resolveRegionSelection(selection: Partial<RegionSelection>): RegionSelection {
  const province = selection.provinceCode ? regionProvinceMap.get(selection.provinceCode) ?? null : null
  if (!province) {
    return {
      provinceCode: '',
      provinceName: '',
      cityCode: '',
      cityName: '',
      districtCode: '',
      districtName: '',
    }
  }

  const city = selection.cityCode ? province.cities.find((item) => item.code === selection.cityCode) ?? null : province.cities[0] ?? null
  if (!city) {
    return {
      provinceCode: province.code,
      provinceName: province.name,
      cityCode: '',
      cityName: '',
      districtCode: '',
      districtName: '',
    }
  }

  const district = selection.districtCode
    ? city.districts.find((item) => item.code === selection.districtCode) ?? null
    : city.districts[0] ?? null

  return {
    provinceCode: province.code,
    provinceName: province.name,
    cityCode: city.code,
    cityName: city.name,
    districtCode: district?.code ?? '',
    districtName: district?.name ?? '',
  }
}

export function formatRegionLabel(selection: Partial<RegionSelection>): string {
  return [selection.provinceName, selection.cityName, selection.districtName].filter(Boolean).join(' / ')
}

export function buildLocationSearchText(parts: {
  provinceName: string
  cityName: string
  districtName: string
  communityName: string
  streetAddress: string
  buildingUnit: string
  doorNumber: string
}): string {
  return [parts.provinceName, parts.cityName, parts.districtName, parts.communityName, parts.streetAddress, parts.buildingUnit, parts.doorNumber]
    .map((part) => part.trim())
    .filter(Boolean)
    .join('')
}
