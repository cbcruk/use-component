# 심볼 종류별 패턴

[`SKILL.md`](SKILL.md) 의 규칙은 같고, 문서가 붙는 **자리**만 종류마다 다르다. 지금 쓰는 심볼의 항목만 읽는다.

## 함수

호버 한 문단 + 시그니처가 못 말하는 축만. 대부분의 함수는 여기서 끝난다.

```ts
/**
 * 재시도 간 대기 시간을 지수적으로 늘려가며 요청한다.
 *
 * @param baseDelay 첫 재시도까지의 대기 시간(ms). 이후 시도마다 두 배가 된다.
 * @throws 마지막 시도까지 실패하면 마지막 응답의 에러를 그대로 던진다.
 */
export function retry<T>(fn: () => Promise<T>, baseDelay: number): Promise<T>;
```

## 옵션 객체 · 인터페이스

객체 자체가 아니라 **각 프로퍼티**에 붙인다. 호버는 프로퍼티 단위로 뜨고, 자동완성도 프로퍼티 단위로 필터링된다.

```ts
/** {@link createServer} 의 동작을 결정하는 옵션. */
export interface ServerOptions {
  /**
   * 수신 포트.
   *
   * @defaultValue 0 — OS가 빈 포트를 고른다.
   */
  port?: number;

  /**
   * 바인딩할 호스트.
   *
   * `0.0.0.0` 은 모든 플랫폼에서 동작하지만 Windows 브라우저는 이 주소로
   * 접속하지 못한다. 안내 문구에는 `localhost` 를 쓴다.
   *
   * @defaultValue "0.0.0.0"
   */
  host?: string;
}
```

프로퍼티가 서로를 제약하면(A를 켜면 B는 무시됨) 그 관계는 인터페이스 본체 문서에 적는다. 프로퍼티 두 곳에 나눠 쓰면 어느 쪽도 전체를 못 말한다.

## 유니온 · 타입 별칭

각 멤버가 **언제 나타나는지**를 적는다. 타입 이름은 모양만 말하고 조건은 못 말한다.

```ts
/** 요청 한 건의 상태. {@link useQuery} 가 이 순서로 전이시킨다. */
export type QueryState<T> =
  /** 아직 요청을 보내지 않았거나 비활성화된 상태. */
  | { status: "idle" }
  /** 응답을 기다리는 중. 재요청 중에도 이전 데이터는 유지되지 않는다. */
  | { status: "pending" }
  | { status: "success"; data: T }
  /** 재시도를 모두 소진한 뒤의 상태. */
  | { status: "error"; error: Error };
```

## 클래스

클래스 본체, 생성자, 그리고 public 메서드·프로퍼티 각각에 붙인다. 본체 문서는 **수명주기**를 말한다 — 언제 만들고, 무엇을 보관하고, 정리해야 하는지.

```ts
/**
 * 하나의 WebSocket 연결을 유지하며 재연결을 관리한다.
 *
 * 인스턴스는 연결당 하나다. 다 쓰면 {@link close} 를 불러야 타이머가 정리된다.
 */
export class SocketClient {
  /** 연결이 끊긴 뒤 자동 재연결을 시도한 횟수. 성공 시 0으로 돌아간다. */
  readonly retryCount: number;

  /** 진행 중인 재연결 타이머를 취소하고 소켓을 닫는다. 두 번 불러도 안전하다. */
  close(): void;
}
```

## React 컴포넌트

Props 인터페이스가 실제 문서 표면이다. 컴포넌트 본체 문서에는 **어디에 놓는 컴포넌트인지**를 적는다 — 필요한 Provider, 렌더 위치 제약, 제어/비제어 여부.

```ts
/**
 * 트리거 옆에 띄우는 팝오버. {@link OverlayProvider} 안에서만 동작한다.
 *
 * 열림 상태는 `open` 을 넘기면 제어 컴포넌트로, 넘기지 않으면 내부 상태로 동작한다.
 */
export function Popover(props: PopoverProps): JSX.Element;

export interface PopoverProps {
  /** 제어 컴포넌트로 쓸 때의 열림 상태. 생략하면 내부에서 관리한다. */
  open?: boolean;
  /** 바깥 클릭·ESC·트리거 재클릭 모두에서 호출된다. */
  onClose?: () => void;
}
```

## 커스텀 훅

훅의 문서는 **호출 규칙**이다. 반환값 모양은 타입이 말하므로, 타입이 못 말하는 세 가지를 적는다: 언제 다시 실행되는지, 무엇을 구독하는지, 정리(cleanup)가 언제 도는지.

```ts
/**
 * 요소가 뷰포트에 들어왔는지 관찰한다.
 *
 * `ref` 가 가리키는 요소가 바뀔 때마다 옵저버를 다시 만든다. 언마운트 시
 * 자동으로 해제되므로 호출부에서 정리할 것은 없다.
 *
 * @param threshold 교차 비율 임계값(0~1). 바꾸면 옵저버가 재생성된다.
 */
export function useInView(ref: RefObject<Element>, threshold?: number): boolean;
```

## 모듈 진입점

여러 모듈을 노출하는 패키지라면 진입 파일 최상단에 `@packageDocumentation` 을 둔다. (Deno/JSR 의 `@module` 자리에 TSDoc·TypeDoc·api-extractor 가 쓰는 태그가 이것이다.)

첫 문단은 이 모듈의 **역할 한 줄**, 이후에 대표 사용 흐름 하나.

````ts
/**
 * HTTP 클라이언트의 진입점. 인스턴스를 만들고 인터셉터를 등록한 뒤 요청한다.
 *
 * ```ts
 * import { createClient } from "@acme/http";
 *
 * const client = createClient({ baseUrl: "https://api.example.com" });
 * const user = await client.get("/me");
 * ```
 *
 * @packageDocumentation
 */
````

## 내부 헬퍼

export 표면이 아니므로 "무엇"은 쓰지 않는다. 코드가 못 말하는 **왜**만 한 줄로 남긴다.

```ts
// Safari 17 미만에서 structuredClone 이 Date 를 잃어버려 수동 복사한다.
```
