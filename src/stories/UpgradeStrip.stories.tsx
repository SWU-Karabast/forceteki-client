import type { Meta, StoryObj } from '@storybook/nextjs';
import UpgradeStrip, { type UpgradeAspect } from '@/app/_components/_sharedcomponents/Cards/UpgradeStrip';

const references = {
    aggression: 'red',
    command: 'green',
    cunning: 'yellow',
    heroism: 'white',
    vigilance: 'blue',
    villainy: 'black',
    neutral: 'grey',
} satisfies Record<UpgradeAspect, string>;

const meta = {
    title: 'Cards/UpgradeStrip',
    component: UpgradeStrip,
    tags: ['autodocs'],
    parameters: { layout: 'centered' },
    argTypes: {
        aspect: { control: 'select', options: Object.keys(references) },
        width: { control: { type: 'range', min: 96, max: 768, step: 24 } },
    },
    args: { aspect: 'vigilance', width: 176, height: 'auto' },
} satisfies Meta<typeof UpgradeStrip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const AllAspects: Story = {
    render: (args) => (
        <div style={{ display: 'grid', gap: 16, color: '#fff' }}>
            {Object.keys(references).map((aspect) => (
                <div key={aspect}>
                    <div style={{ textTransform: 'capitalize', marginBottom: 4 }}>{aspect}</div>
                    <UpgradeStrip {...args} aspect={aspect as UpgradeAspect} />
                </div>
            ))}
        </div>
    ),
};

export const CompareWithOriginals: Story = {
    parameters: {
        docs: {
            description: {
                story: 'Original PNGs beside the cropped SVG component at the same overall width. The SVG omits the black backing and outer padding. Increase width to compare scaling.',
            },
        },
    },
    render: (args) => (
        <table style={{ color: '#fff', borderSpacing: '16px 8px' }}>
            <thead>
                <tr><th>Aspect</th><th>Original PNG</th><th>React SVG</th></tr>
            </thead>
            <tbody>
                {Object.entries(references).map(([aspect, color]) => (
                    <tr key={aspect}>
                        <th scope="row" style={{ textAlign: 'left', textTransform: 'capitalize' }}>{aspect}</th>
                        <td>
                            {/* Native images preserve the source artwork for this visual comparison. */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={`/upgrade-${color}.png`}
                                alt={`${aspect} upgrade original`}
                                style={{ display: 'block', width: args.width, height: 'auto' }}
                            />
                        </td>
                        <td><UpgradeStrip {...args} aspect={aspect as UpgradeAspect} style={{ display: 'block' }} /></td>
                    </tr>
                ))}
            </tbody>
        </table>
    ),
};
