import { h, render, Component } from "zreact";

interface DummyProps {
    initialInput: string;
}

interface DummyState {
    input?: string;
}

class DummyComponent extends Component<DummyProps, DummyState> {
    constructor(props: DummyProps, c: any) {
        super(props, c);
        this.state = {
            input: `x${this.props}x`,
        };
    }
    public render({ initialInput }: DummyProps, { input }: DummyState, c: any, h: any) {
        return <DummerComponent initialInput={initialInput} input={input}/>;
    }
}

interface DummerComponentProps extends DummyProps, DummyState {

}

function DummerComponent({ input, initialInput }: DummerComponentProps, c: any, h: any) {
    return <div>Input: {input}, initial: {initialInput}</div>;
}

render(<DummerComponent initialInput="The input"/>, document.getElementById("xxx"));
