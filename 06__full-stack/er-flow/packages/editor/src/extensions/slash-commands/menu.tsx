import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { ReactRenderer } from "@tiptap/react";
import tippy from "tippy.js";
import { type CommandItem, slashCommandsList } from "./index";

// Tippy stylesheet is required for standard alignment
import "tippy.js/dist/tippy.css";

interface MenuProps {
  items: CommandItem[];
  command: (item: CommandItem) => void;
}

export const SlashCommandsMenu = forwardRef<{ onKeyDown: (props: { event: KeyboardEvent }) => boolean }, MenuProps>(
  (props, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    const selectItem = (index: number) => {
      const item = props.items[index];
      if (item) {
        props.command(item);
      }
    };

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (event.key === "ArrowUp") {
          setSelectedIndex((selectedIndex + props.items.length - 1) % props.items.length);
          return true;
        }
        if (event.key === "ArrowDown") {
          setSelectedIndex((selectedIndex + 1) % props.items.length);
          return true;
        }
        if (event.key === "Enter") {
          selectItem(selectedIndex);
          return true;
        }
        return false;
      },
    }));

    useEffect(() => {
      setSelectedIndex(0);
    }, [props.items]);

    return (
      <div className="bg-slate-900 border border-slate-800 rounded-lg shadow-2xl overflow-hidden py-1 w-60 max-h-72 overflow-y-auto z-50">
        {props.items.length === 0 ? (
          <div className="px-3 py-2 text-slate-500 text-xs italic">No matching commands</div>
        ) : (
          props.items.map((item, index) => {
            const Icon = item.icon;
            const isSelected = index === selectedIndex;
            return (
              <button
                key={index}
                type="button"
                onClick={() => selectItem(index)}
                className={`w-full text-left px-3 py-1.5 flex items-center gap-3 transition-colors text-xs ${
                  isSelected ? "bg-indigo-600 text-white font-semibold" : "hover:bg-slate-800 text-slate-300"
                }`}
              >
                <div
                  className={`p-1.5 rounded-md ${
                    isSelected ? "bg-indigo-500 text-white" : "bg-slate-800 text-indigo-400"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div>
                  <div className="leading-none">{item.title}</div>
                  <div
                    className={`text-[9px] mt-0.5 leading-none ${
                      isSelected ? "text-indigo-200" : "text-slate-500"
                    }`}
                  >
                    {item.description}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    );
  }
);

SlashCommandsMenu.displayName = "SlashCommandsMenu";

export const slashSuggestion = {
  items: ({ query }: { query: string }) => {
    return slashCommandsList
      .filter((item) => item.title.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 10);
  },

  render: () => {
    let component: any;
    let popup: any;

    return {
      onStart: (props: any) => {
        component = new ReactRenderer(SlashCommandsMenu, {
          props,
          editor: props.editor,
        });

        if (!props.clientRect) {
          return;
        }

        popup = tippy("body", {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: "manual",
          placement: "bottom-start",
        });
      },

      onUpdate(props: any) {
        component.updateProps(props);

        if (!props.clientRect) {
          return;
        }

        popup[0].setProps({
          getReferenceClientRect: props.clientRect,
        });
      },

      onKeyDown(props: any) {
        if (props.event.key === "Escape") {
          popup[0].hide();
          return true;
        }

        return component.ref?.onKeyDown(props);
      },

      onExit() {
        if (popup && popup[0]) {
          popup[0].destroy();
        }
        if (component) {
          component.destroy();
        }
      },
    };
  },
};
