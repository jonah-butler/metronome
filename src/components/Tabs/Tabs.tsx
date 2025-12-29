import { Children, isValidElement, useState, type ReactElement } from 'react';
import '../../css/Tabs.css';

type TabsProps = {
  index?: number;
  children: React.ReactNode;
  updateTab(tab: number): void;
};

// React.FC<React.SVGProps<SVGSVGElement>>
type TabProps = {
  label: React.ReactNode;
  children: React.ReactNode;
};

function isTabElement(child: React.ReactNode): child is ReactElement<TabProps> {
  if (!isValidElement(child)) return false;

  const props = child.props as Record<string, unknown>;
  return 'label' in props;
}

export function Tabs({ index, children, updateTab }: TabsProps) {
  const [activeIndex, setActiveIndex] = useState(index ?? 0);

  const tabs = Children.toArray(children).filter(isTabElement);

  const activeTab = tabs[activeIndex];

  const handleTabUpdate = (index: number): void => {
    setActiveIndex(index);
    updateTab(index);
  };

  return (
    <div className="tabs">
      <div className="tabs__inner-container">
        {/* Tab Buttons */}
        <div className="tab-list">
          {tabs.map((tab, index) => (
            <button
              key={index}
              className={`tab-button ${index === activeIndex ? 'active' : ''}`}
              onClick={() => handleTabUpdate(index)}
            >
              {tab.props.label}
            </button>
          ))}
        </div>

        {/* Active Tab Content (slot-like) */}
        <div className="tab-panel">{activeTab?.props.children}</div>
      </div>
    </div>
  );
}

Tabs.Tab = function Tab({ children }: TabProps) {
  return <>{children}</>;
};
