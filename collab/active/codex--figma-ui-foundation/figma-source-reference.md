# Figma 원본 공통 요소 컨텍스트

확인일 2026-10-14. 제품 코드가 아닌 구현 참고 원문이다. 캔버스 목업은 제외하고 사용자 승인 로고와 실제 데이터 의미 예외는 spec-proposal.md를 따른다. 임시 자산 URL은 다운로드 소스로만 사용한다.

## 18:2360

const assetPathPrefix = "[비공개 원본 다운로드 URL: 로컬 캐시 사용]";
const imgEllipse = `${assetPathPrefix}/91ddb.svg`;

export default function FloatingHeaderPill() {
  return (
    <div className="backdrop-blur-[20px] bg-[rgba(255,255,255,0.88)] border border-solid border-white content-stretch flex gap-[8px] items-center px-[16px] py-[10px] relative rounded-[16px] shadow-[0px_8px_24px_0px_rgba(0,0,0,0.07)] size-full" data-node-id="18:2360" data-name="floating-header-pill">
      <div className="content-stretch flex gap-[6px] items-center relative shrink-0" data-node-id="18:2361" data-name="logo-section">
        <div className="relative shrink-0 size-[8px]" data-node-id="18:2362" data-name="Ellipse">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgEllipse} />
        </div>
        <p className="[word-break:break-word] font-['Inter:Extra_Bold'] font-extrabold leading-[normal] not-italic relative shrink-0 text-[#0f172a] text-[16px] whitespace-nowrap" data-node-id="18:2363">
          흉흉
        </p>
      </div>
      <div className="bg-[#e2e8f0] h-[14px] relative shrink-0 w-px" data-node-id="18:2364" data-name="divider" />
      <p className="[word-break:break-word] flex-[1_0_0] font-['Inter:Regular'] font-normal leading-[normal] min-w-px not-italic overflow-hidden relative text-[#64748b] text-[13px] text-ellipsis whitespace-nowrap" data-node-id="18:2365">
        주소, 사고 유형 검색...
      </p>
      <div className="bg-[#f1f5f9] content-stretch flex items-center justify-center relative rounded-[16px] shrink-0 size-[32px]" data-node-id="18:2366" data-name="search-action-btn">
        <p className="[word-break:break-word] font-['Inter:Regular'] font-normal leading-[normal] not-italic relative shrink-0 text-[14px] text-black whitespace-nowrap" data-node-id="18:2367">
          🔍
        </p>
      </div>
    </div>
  );
}
SUPER CRITICAL: The generated React+Tailwind code MUST be converted to match the target project's technology stack and styling system.
1. Analyze the target codebase to identify: technology stack, styling approach, component patterns, and design tokens
2. Convert React syntax to the target framework/library
3. Transform all Tailwind classes to the target styling system while preserving exact visual design
4. Follow the project's existing patterns and conventions
DO NOT install any Tailwind as a dependency unless the user instructs you to do so.

Node ids have been added to the code as data attributes, e.g. `data-node-id="1:2"`.
The generated code contains image and SVG URL constants, e.g. const image = `${assetPathPrefix}/<asset file name>`, where assetPathPrefix is declared once at the top of the code and every asset URL interpolates it. These URLs are temporary download sources and expire after 7 days. Download each asset into the project with curl -L, then replace its URL in the generated code with a reference to the downloaded asset. Never use the temporary URLs as runtime image sources.

## 18:2368

const assetPathPrefix = "[비공개 원본 다운로드 URL: 로컬 캐시 사용]";
const imgBasilFilterSolid = `${assetPathPrefix}/47975.svg`;

export default function FiltersRow() {
  return (
    <div className="content-stretch flex gap-[6px] items-start px-[16px] relative size-full" data-node-id="18:2368" data-name="filters-row">
      <div className="backdrop-blur-[8px] bg-[rgba(255,255,255,0.88)] border border-[rgba(200,210,220,0.6)] border-solid content-stretch flex items-center px-[12px] py-[6px] relative rounded-[20px] shrink-0" data-node-id="45:3712" data-name="filter-chip-기간">
        <div className="relative shrink-0 size-[18px]" data-node-id="45:3713" data-name="basil:filter-solid">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgBasilFilterSolid} />
        </div>
      </div>
      <div className="[word-break:break-word] backdrop-blur-[8px] bg-[rgba(255,255,255,0.88)] border border-[rgba(200,210,220,0.6)] border-solid content-stretch flex gap-[4px] items-center leading-[normal] not-italic px-[12px] py-[6px] relative rounded-[20px] shrink-0 whitespace-nowrap" data-node-id="18:2369" data-name="filter-chip-기간">
        <p className="font-['Inter:Semi_Bold'] font-semibold relative shrink-0 text-[#0f172a] text-[12px]" data-node-id="18:2370">
          기간
        </p>
        <p className="font-['Inter:Regular'] font-normal relative shrink-0 text-[#64748b] text-[8px]" data-node-id="18:2371">
          ▼
        </p>
      </div>
      <div className="[word-break:break-word] backdrop-blur-[8px] bg-[rgba(255,255,255,0.88)] border border-[rgba(200,210,220,0.6)] border-solid content-stretch flex gap-[4px] items-center leading-[normal] not-italic px-[12px] py-[6px] relative rounded-[20px] shrink-0 whitespace-nowrap" data-node-id="18:2372" data-name="filter-chip-카테고리">
        <p className="font-['Inter:Semi_Bold'] font-semibold relative shrink-0 text-[#0f172a] text-[12px]" data-node-id="18:2373">
          카테고리
        </p>
        <p className="font-['Inter:Regular'] font-normal relative shrink-0 text-[#64748b] text-[8px]" data-node-id="18:2374">
          ▼
        </p>
      </div>
      <div className="[word-break:break-word] backdrop-blur-[8px] bg-[rgba(255,255,255,0.88)] border border-[rgba(200,210,220,0.6)] border-solid content-stretch flex gap-[4px] items-center leading-[normal] not-italic px-[12px] py-[6px] relative rounded-[20px] shrink-0 whitespace-nowrap" data-node-id="18:2375" data-name="filter-chip-상태">
        <p className="font-['Inter:Semi_Bold'] font-semibold relative shrink-0 text-[#0f172a] text-[12px]" data-node-id="18:2376">
          상태
        </p>
        <p className="font-['Inter:Regular'] font-normal relative shrink-0 text-[#64748b] text-[8px]" data-node-id="18:2377">
          ▼
        </p>
      </div>
    </div>
  );
}
SUPER CRITICAL: The generated React+Tailwind code MUST be converted to match the target project's technology stack and styling system.
1. Analyze the target codebase to identify: technology stack, styling approach, component patterns, and design tokens
2. Convert React syntax to the target framework/library
3. Transform all Tailwind classes to the target styling system while preserving exact visual design
4. Follow the project's existing patterns and conventions
DO NOT install any Tailwind as a dependency unless the user instructs you to do so.

Node ids have been added to the code as data attributes, e.g. `data-node-id="1:2"`.
The generated code contains image and SVG URL constants, e.g. const image = `${assetPathPrefix}/<asset file name>`, where assetPathPrefix is declared once at the top of the code and every asset URL interpolates it. These URLs are temporary download sources and expire after 7 days. Download each asset into the project with curl -L, then replace its URL in the generated code with a reference to the downloaded asset. Never use the temporary URLs as runtime image sources.

## 18:2428

const assetPathPrefix = "[비공개 원본 다운로드 URL: 로컬 캐시 사용]";
const imgMapPin = `${assetPathPrefix}/782e6.svg`;

export default function NavBarBody() {
  return (
    <div className="backdrop-blur-[20px] bg-[rgba(255,255,255,0.88)] border border-[#e8edf2] border-solid content-stretch drop-shadow-[0px_8px_16px_rgba(0,0,0,0.1)] flex items-center px-[12px] py-[6px] relative rounded-[28px] size-full" data-node-id="18:2428" data-name="nav-bar-body">
      <div className="content-stretch flex flex-[1_0_0] flex-col gap-[2px] items-center justify-center min-w-px py-[6px] relative rounded-[20px]" data-node-id="18:2429" data-name="nav-tab-map">
        <div className="relative shrink-0 size-[22px]" data-node-id="19:2527" data-name="map-pin">
          <img alt="" className="absolute block inset-0 max-w-none size-full" src={imgMapPin} />
        </div>
        <p className="[word-break:break-word] font-['Inter:Bold'] font-bold leading-[normal] not-italic relative shrink-0 text-[#e81a2b] text-[10px] whitespace-nowrap" data-node-id="18:2431">
          홈
        </p>
      </div>
      <div className="bg-[#e81a2b] content-stretch drop-shadow-[0px_6px_8px_rgba(232,26,43,0.35)] flex flex-col items-center justify-center relative rounded-[27px] shrink-0 size-[54px]" data-node-id="18:2432" data-name="nav-tab-report">
        <p className="[word-break:break-word] font-['Inter:Regular'] font-normal leading-[normal] not-italic relative shrink-0 text-[22px] text-white whitespace-nowrap" data-node-id="18:2433">
          📢
        </p>
      </div>
      <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-[2px] items-center justify-center leading-[normal] min-w-px not-italic py-[6px] relative rounded-[20px] text-[#94a3b8] whitespace-nowrap" data-node-id="18:2434" data-name="nav-tab-list">
        <p className="font-['Inter:Regular'] font-normal relative shrink-0 text-[18px]" data-node-id="18:2435">
          ≡
        </p>
        <p className="font-['Inter:Bold'] font-bold relative shrink-0 text-[10px]" data-node-id="18:2436">
          목록
        </p>
      </div>
    </div>
  );
}
SUPER CRITICAL: The generated React+Tailwind code MUST be converted to match the target project's technology stack and styling system.
1. Analyze the target codebase to identify: technology stack, styling approach, component patterns, and design tokens
2. Convert React syntax to the target framework/library
3. Transform all Tailwind classes to the target styling system while preserving exact visual design
4. Follow the project's existing patterns and conventions
DO NOT install any Tailwind as a dependency unless the user instructs you to do so.

Node ids have been added to the code as data attributes, e.g. `data-node-id="1:2"`.
The generated code contains image and SVG URL constants, e.g. const image = `${assetPathPrefix}/<asset file name>`, where assetPathPrefix is declared once at the top of the code and every asset URL interpolates it. These URLs are temporary download sources and expire after 7 days. Download each asset into the project with curl -L, then replace its URL in the generated code with a reference to the downloaded asset. Never use the temporary URLs as runtime image sources.

## 11:2210

export default function NavBarBody() {
  return (
    <div className="backdrop-blur-[20px] bg-[rgba(255,255,255,0.88)] border border-[#e8edf2] border-solid content-stretch drop-shadow-[0px_8px_16px_rgba(0,0,0,0.1)] flex items-center px-[12px] py-[6px] relative rounded-[28px] size-full" data-node-id="11:2210" data-name="nav-bar-body">
      <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-[2px] items-center justify-center leading-[normal] min-w-px not-italic py-[6px] relative rounded-[20px] text-[#e81a2b] whitespace-nowrap" data-node-id="11:2211" data-name="nav-tab-map">
        <p className="font-['Inter:Regular'] font-normal relative shrink-0 text-[18px]" data-node-id="11:2212">
          🗺️
        </p>
        <p className="font-['Inter:Bold'] font-bold relative shrink-0 text-[10px]" data-node-id="11:2213">
          지도
        </p>
      </div>
      <div className="bg-[#e81a2b] content-stretch drop-shadow-[0px_6px_8px_rgba(232,26,43,0.35)] flex flex-col items-center justify-center relative rounded-[27px] shrink-0 size-[54px]" data-node-id="11:2214" data-name="nav-tab-report">
        <p className="[word-break:break-word] font-['Inter:Regular'] font-normal leading-[normal] not-italic relative shrink-0 text-[22px] text-white whitespace-nowrap" data-node-id="11:2215">
          📢
        </p>
      </div>
      <div className="[word-break:break-word] content-stretch flex flex-[1_0_0] flex-col gap-[2px] items-center justify-center leading-[normal] min-w-px not-italic py-[6px] relative rounded-[20px] text-[#94a3b8] whitespace-nowrap" data-node-id="11:2216" data-name="nav-tab-list">
        <p className="font-['Inter:Regular'] font-normal relative shrink-0 text-[18px]" data-node-id="11:2217">
          ≡
        </p>
        <p className="font-['Inter:Bold'] font-bold relative shrink-0 text-[10px]" data-node-id="11:2218">
          목록
        </p>
      </div>
    </div>
  );
}
SUPER CRITICAL: The generated React+Tailwind code MUST be converted to match the target project's technology stack and styling system.
1. Analyze the target codebase to identify: technology stack, styling approach, component patterns, and design tokens
2. Convert React syntax to the target framework/library
3. Transform all Tailwind classes to the target styling system while preserving exact visual design
4. Follow the project's existing patterns and conventions
DO NOT install any Tailwind as a dependency unless the user instructs you to do so.

Node ids have been added to the code as data attributes, e.g. `data-node-id="1:2"`.
The generated code contains image and SVG URL constants, e.g. const image = `${assetPathPrefix}/<asset file name>`, where assetPathPrefix is declared once at the top of the code and every asset URL interpolates it. These URLs are temporary download sources and expire after 7 days. Download each asset into the project with curl -L, then replace its URL in the generated code with a reference to the downloaded asset. Never use the temporary URLs as runtime image sources.

## 45:3691

export default function FilterDropdown() {
  return (
    <div className="content-stretch flex flex-col items-start overflow-clip relative rounded-[14px] shadow-[0px_8px_32px_0px_rgba(0,0,0,0.14)] size-full" data-node-id="45:3691" data-name="FilterDropdown">
      <div aria-hidden className="absolute backdrop-blur-[20px] bg-[rgba(255,255,255,0.97)] inset-0 pointer-events-none rounded-[14px]" />
      <div className="bg-[rgba(100,116,139,0.07)] border-[rgba(0,0,0,0.04)] border-b-[1.035px] border-solid content-stretch flex gap-[10px] items-center px-[16px] py-[12px] relative shrink-0 w-full" data-node-id="45:3692" data-name="Button">
        <div className="bg-[#64748b] relative rounded-[3.993px] shrink-0 size-[7.987px]" data-node-id="45:3693" data-name="Text" />
        <div className="content-stretch flex flex-col items-start relative shrink-0" data-node-id="45:3694" data-name="Text">
          <p className="[word-break:break-word] font-['Pretendard:SemiBold'] leading-[21px] not-italic relative shrink-0 text-[#64748b] text-[14px] whitespace-nowrap" data-node-id="45:3695">
            전체
          </p>
        </div>
        <div className="content-stretch flex flex-[1_0_0] items-start justify-end min-w-px relative" data-node-id="45:3696" data-name="Text:align">
          <div className="content-stretch flex flex-col items-start relative shrink-0" data-node-id="45:3697" data-name="Text">
            <p className="[word-break:break-word] font-['Pretendard:Regular'] leading-[21px] not-italic relative shrink-0 text-[#64748b] text-[14px] whitespace-nowrap" data-node-id="45:3698">
              ✓
            </p>
          </div>
        </div>
      </div>
      <div className="border-[rgba(0,0,0,0.04)] border-b-[1.035px] border-solid content-stretch flex gap-[10px] items-center px-[16px] py-[12px] relative shrink-0 w-full" data-node-id="45:3699" data-name="Button">
        <div className="bg-[#cbd5e1] relative rounded-[3.993px] shrink-0 size-[7.987px]" data-node-id="45:3700" data-name="Text" />
        <div className="content-stretch flex flex-col items-start relative shrink-0" data-node-id="45:3701" data-name="Text">
          <p className="[word-break:break-word] font-['Pretendard:Regular'] leading-[21px] not-italic relative shrink-0 text-[#334155] text-[14px] whitespace-nowrap" data-node-id="45:3702">
            진행 중
          </p>
        </div>
      </div>
      <div className="border-[rgba(0,0,0,0.04)] border-b-[1.035px] border-solid content-stretch flex gap-[10px] items-center px-[16px] py-[12px] relative shrink-0 w-full" data-node-id="45:3703" data-name="Button">
        <div className="bg-[#cbd5e1] relative rounded-[3.993px] shrink-0 size-[7.987px]" data-node-id="45:3704" data-name="Text" />
        <div className="content-stretch flex flex-col items-start relative shrink-0" data-node-id="45:3705" data-name="Text">
          <p className="[word-break:break-word] font-['Pretendard:Regular'] leading-[21px] not-italic relative shrink-0 text-[#334155] text-[14px] whitespace-nowrap" data-node-id="45:3706">
            공론화 성공
          </p>
        </div>
      </div>
      <div className="border-[rgba(0,0,0,0.04)] border-b-[1.035px] border-solid content-stretch flex gap-[10px] items-center px-[16px] py-[12px] relative shrink-0 w-full" data-node-id="45:3707" data-name="Button">
        <div className="bg-[#cbd5e1] relative rounded-[3.993px] shrink-0 size-[7.987px]" data-node-id="45:3708" data-name="Text" />
        <div className="content-stretch flex flex-col items-start relative shrink-0" data-node-id="45:3709" data-name="Text">
          <p className="[word-break:break-word] font-['Pretendard:Regular'] leading-[21px] not-italic relative shrink-0 text-[#334155] text-[14px] whitespace-nowrap" data-node-id="45:3710">
            종결
          </p>
        </div>
      </div>
      <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_0px_0px_1px_rgba(255,255,255,0.7)]" />
    </div>
  );
}
SUPER CRITICAL: The generated React+Tailwind code MUST be converted to match the target project's technology stack and styling system.
1. Analyze the target codebase to identify: technology stack, styling approach, component patterns, and design tokens
2. Convert React syntax to the target framework/library
3. Transform all Tailwind classes to the target styling system while preserving exact visual design
4. Follow the project's existing patterns and conventions
DO NOT install any Tailwind as a dependency unless the user instructs you to do so.

Node ids have been added to the code as data attributes, e.g. `data-node-id="1:2"`.
The generated code contains image and SVG URL constants, e.g. const image = `${assetPathPrefix}/<asset file name>`, where assetPathPrefix is declared once at the top of the code and every asset URL interpolates it. These URLs are temporary download sources and expire after 7 days. Download each asset into the project with curl -L, then replace its URL in the generated code with a reference to the downloaded asset. Never use the temporary URLs as runtime image sources.