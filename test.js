import { Component } from "./component";
import { extendComponent } from "./util";

export function createContext(value) {
    var context = {
        default: value
    }
	function Provider(p, c) {
		Component.call(this, p, c);
        this.c = [];
        this.p = this.p.bind(_this);
        this.u = this.u.bind(_this);
	}

	extendComponent(Provider.prototype, {
		p(subscriber) {
            this.c.push(subscriber);
            return this.props.value;
        },
        u(subscriber) {
            this.c = this.c.filter(function (i) { return i !== subscriber; });
        },
        getChildContext() {
            var provider = {
                push: this.p,
                pop: this.u,
                context: context,
            };
            if (this.context.providers) {
                this.context.providers.push(provider);
            }
            else {
                this.context.providers = [provider];
            }
            return this.context;
        },
        componentWillReceiveProps(nextProps) {
            if (this.props.value !== nextProps.value) {
                this.c.forEach(function (subscriber) {
                    subscriber(nextProps.value);
                });
            }
        },
        render() {
            return this.props.children && this.props.children[0];
        }
	});
	function Consumer(p, c) {
		Component.call(this, p, c);
        this.updateContext = this.updateContext.bind(_this);
        if (c.providers) {
            for (var i = c.providers.length - 1; i >= 0; i--) {
                var provider = c.providers[i];
                if (provider.context === context) {
                    var value = provider.push(this.updateContext);
                    this.state = {
                        value: value,
                    };
                    this.popSubscriber = provider.pop;
                    break;
                }
            }
        }
	}
	extendComponent(Consumer.prototype, {
		updateContext(val) {
            this.setState({ value: val });
        },
        componentWillUnmount() {
            if (this.popSubscriber) {
                this.popSubscriber(this.updateContext);
            }
        },
        render() {
            return this.props.children && this.props.children[0](this.state.value);
        }
	});
    context.Provider = Provider
    context.Consumer = Consumer
	return context;
}